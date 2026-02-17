/**
 * GET /auth/from-app?code=xxx&returnTo=/dashboard
 * Consumes a one-time code from the native app session handoff, sets the web session cookie, redirects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function base64UrlEncode(sessionJson: string): string {
  return Buffer.from(sessionJson, 'utf-8').toString('base64url');
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnTo = requestUrl.searchParams.get('returnTo') ?? '/dashboard';

  const loginUrl = new URL('/login', request.url);

  if (!code) {
    return NextResponse.redirect(loginUrl);
  }

  const admin = createAdminClient();
  const { data: row, error } = await (admin as any)
    .from('auth_handoff')
    .select('session_payload, expires_at')
    .eq('code', code)
    .single();

  if (error || !row) {
    loginUrl.searchParams.set('error', 'handoff_expired');
    return NextResponse.redirect(loginUrl);
  }

  if (new Date(row.expires_at) < new Date()) {
    await (admin as any).from('auth_handoff').delete().eq('code', code);
    loginUrl.searchParams.set('error', 'handoff_expired');
    return NextResponse.redirect(loginUrl);
  }

  await (admin as any).from('auth_handoff').delete().eq('code', code);

  let session: { expires_at?: number };
  try {
    session = JSON.parse(row.session_payload);
  } catch {
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = 'base64-' + base64UrlEncode(row.session_payload);
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

  // Restrict redirect to same-origin path (prevent open redirect)
  const safeReturnTo =
    typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !returnTo.includes('\\')
      ? returnTo
      : '/dashboard';
  const redirectUrl = new URL(safeReturnTo, request.url);
  if (redirectUrl.origin !== requestUrl.origin) {
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.set(cookieName, cookieValue, {
    path: '/',
    expires: new Date(expiresAt * 1000),
    httpOnly: false,
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
  });

  return res;
}
