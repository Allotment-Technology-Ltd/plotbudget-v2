import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';
import { checkRateLimit } from '@/lib/rate-limit';

const COUNTRY_COOKIE_NAME = 'x-plot-country';

// Vercel Edge adds geo to the request; not in NextRequest types
type RequestWithGeo = NextRequest & { geo?: { country?: string } };

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
  return ip;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authPaths = ['/login', '/signup', '/auth/callback'];
  if (authPaths.includes(path)) {
    const { allowed } = await checkRateLimit(getClientIdentifier(request), 'auth');
    if (!allowed) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Set country from Vercel geo for region checks (signup allowed: UK, EU, USA, Canada)
  const country = (request as RequestWithGeo).geo?.country;
  if (country) {
    response.cookies.set(COUNTRY_COOKIE_NAME, country, {
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
      sameSite: 'lax',
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Use getUser() so auth is validated with the server; getSession() can be stale and cause redirect loops
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: row } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
    isAdmin = (row as { is_admin?: boolean } | null)?.is_admin === true;
  }

  const cookieStore = { get: (name: string) => request.cookies.get(name) };
  const flags = await getServerFeatureFlags(user?.id ?? null, { isAdmin, cookies: cookieStore });

  // When signup is gated, hide pricing page — except for admins (they can use all functionality)
  if (request.nextUrl.pathname === '/pricing') {
    if (flags.signupGated && !isAdmin) {
      const url = new URL(request.url);
      return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', url));
    }
  }

  // Root: no holding page — redirect to login or dashboard (removes app.plotbudget.com landing)
  if (request.nextUrl.pathname === '/') {
    const url = new URL(request.url);
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', url));
    }
    return NextResponse.redirect(new URL('/login', url));
  }

  // Protected routes - require authenticated user (partners use accounts, not cookie)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Essential setup gate: user must have a household (owner or partner) to access dashboard.
    // Launcher at /dashboard is shown once they have a household; Money onboarding is gated per-module.
    const { data: profile } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .single();

    const { data: partnerHousehold } = await supabase
      .from('households')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle();

    const hasHousehold = !!(profile?.household_id ?? partnerHousehold);

    // Allow /dashboard/settings so owners can always reach it; the settings page redirects to onboarding if no household.
    const isSettingsPath = request.nextUrl.pathname === '/dashboard/settings';
    if (
      !hasHousehold &&
      !request.nextUrl.pathname.includes('/onboarding') &&
      !isSettingsPath
    ) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding: require auth; redirect away if already completed
  if (request.nextUrl.pathname.includes('/onboarding')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  if (request.nextUrl.pathname.includes('/onboarding') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('has_completed_onboarding')
      .eq('id', user.id)
      .single();

    if (profile?.has_completed_onboarding) {
      return NextResponse.redirect(new URL('/dashboard/money/blueprint', request.url));
    }
  }

  // Auth routes - redirect to dashboard (or redirect param e.g. partner join) if already authenticated
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const path = redirectTo ?? '/dashboard';
      const requestOrigin = new URL(request.url).origin;
      const candidate = path.startsWith('/') && !path.startsWith('//')
        ? new URL(path, request.url)
        : new URL('/dashboard', request.url);
      if (candidate.origin !== requestOrigin) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      const safeRedirect = new URL(candidate.pathname + candidate.search, requestOrigin);
      return NextResponse.redirect(safeRedirect);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/auth/:path*',
    '/onboarding/:path*',
    '/partner/:path*',
    '/pricing',
  ],
};
