import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const REDIRECT_AFTER_AUTH_COOKIE = 'redirect_after_auth';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectPath = request.cookies.get(REDIRECT_AFTER_AUTH_COOKIE)?.value;
  if (redirectPath) {
    try {
      let decoded = decodeURIComponent(redirectPath);
      // After email confirmation, session may not be visible to server on first load (e.g. mobile).
      // Send partner-invite flow to client /partner/complete so it can accept and redirect with session.
      if (decoded.startsWith('/partner/join?')) {
        decoded = decoded.replace(/^\/partner\/join/, '/partner/complete');
      }
      if (decoded.startsWith('/')) {
        const url = new URL(decoded, request.url);
        const res = NextResponse.redirect(url);
        res.cookies.set(REDIRECT_AFTER_AUTH_COOKIE, '', { path: '/', maxAge: 0 });
        return res;
      }
    } catch {
      // ignore invalid cookie
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
