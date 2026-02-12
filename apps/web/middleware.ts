import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const COUNTRY_COOKIE_NAME = 'x-plot-country';

// Vercel Edge adds geo to the request; not in NextRequest types
type RequestWithGeo = NextRequest & { geo?: { country?: string } };

export async function middleware(request: NextRequest) {
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

    // If authenticated, check onboarding: owners go to onboarding until complete;
    // partners (partner_user_id set) can use dashboard without completing owner onboarding.
    const { data: profile } = await supabase
      .from('users')
      .select('has_completed_onboarding')
      .eq('id', user.id)
      .single();

    const { data: partnerHousehold } = await supabase
      .from('households')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle();

    const isPartner = !!partnerHousehold;

    if (
      profile != null &&
      !profile.has_completed_onboarding &&
      !isPartner &&
      !request.nextUrl.pathname.includes('/onboarding')
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
      return NextResponse.redirect(new URL('/dashboard/blueprint', request.url));
    }
  }

  // Auth routes - redirect to dashboard (or redirect param e.g. partner join) if already authenticated
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect');
      const path = redirectTo ?? '/dashboard';
      const url = path.startsWith('/') ? new URL(path, request.url) : new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
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
    '/onboarding/:path*',
    '/partner/:path*',
    '/pricing',
  ],
};
