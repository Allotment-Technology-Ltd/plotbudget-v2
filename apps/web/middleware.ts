import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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

  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes - redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If authenticated, check onboarding status for dashboard routes
    const { data: profile } = await supabase
      .from('users')
      .select('has_completed_onboarding')
      .eq('id', session.user.id)
      .single();

    // Redirect to onboarding if not completed (except if already on onboarding page)
    if (
      !profile?.has_completed_onboarding &&
      !request.nextUrl.pathname.includes('/onboarding')
    ) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Onboarding: require auth; redirect away if already completed
  if (request.nextUrl.pathname.includes('/onboarding')) {
    if (!session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  if (request.nextUrl.pathname.includes('/onboarding') && session) {
    const { data: profile } = await supabase
      .from('users')
      .select('has_completed_onboarding')
      .eq('id', session.user.id)
      .single();

    if (profile?.has_completed_onboarding) {
      return NextResponse.redirect(new URL('/dashboard/blueprint', request.url));
    }
  }

  // Auth routes - redirect to dashboard if already authenticated
  if (['/login', '/signup'].includes(request.nextUrl.pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
    '/onboarding/:path*',
  ],
};
