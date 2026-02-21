/**
 * GET /auth/from-app?code=xxx&returnTo=/dashboard
 * Consumes a one-time code from the native app session handoff, sets the web session cookie, redirects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function base64UrlEncode(sessionJson: string): string {
  return Buffer.from(sessionJson, 'utf-8').toString('base64url');
}

/** Consume handoff row by code; returns session_payload string or null if missing/expired/invalid. */
async function consumeHandoffCode(adminClient: ReturnType<typeof createAdminClient>, code: string): Promise<string | null> {
  const admin = adminClient as unknown as {
    from: (t: string) => {
      select: (s: string) => { eq: (k: string, v: string) => { single: () => Promise<{ data: { session_payload?: string; expires_at?: string } | null; error: unknown }> } };
      delete: () => { eq: (k: string, v: string) => Promise<unknown> };
    };
  };
  const { data: row, error } = await admin.from('auth_handoff').select('session_payload, expires_at').eq('code', code).single();
  if (error || !row?.session_payload) return null;
  if (new Date(row.expires_at ?? 0) < new Date()) {
    await admin.from('auth_handoff').delete().eq('code', code);
    return null;
  }
  await admin.from('auth_handoff').delete().eq('code', code);
  return row.session_payload;
}

function getSafeRedirectPath(returnTo: string, requestUrl: URL, request: NextRequest): string | null {
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.includes('\\')) {
    return null;
  }
  const redirectUrl = new URL(returnTo, request.url);
  return redirectUrl.origin === requestUrl.origin ? returnTo : null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnTo = requestUrl.searchParams.get('returnTo') ?? '/dashboard';
  const loginUrl = new URL('/login', request.url);

  if (!code) {
    return NextResponse.redirect(loginUrl);
  }

  const adminClient = createAdminClient();
  const sessionPayload = await consumeHandoffCode(adminClient, code);
  if (!sessionPayload) {
    loginUrl.searchParams.set('error', 'handoff_expired');
    return NextResponse.redirect(loginUrl);
  }

  type SessionLike = { expires_at?: number; access_token?: string; user?: unknown };
  let session: SessionLike;
  try {
    let parsed: unknown = JSON.parse(sessionPayload);
    // Handle double-stringified payload (e.g. from native or storage): parse until we have an object
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Session payload is not an object');
    }
    session = parsed as SessionLike;
  } catch {
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    loginUrl.searchParams.set('error', 'auth_failed');
    return NextResponse.redirect(loginUrl);
  }

  const safeReturnTo = getSafeRedirectPath(returnTo, requestUrl, request) ?? '/dashboard';
  const redirectUrl = new URL(safeReturnTo, request.url);
  const res = NextResponse.redirect(redirectUrl);

  // Always write a single stringified session object so the Supabase client receives JSON that parses to an object (avoids "Cannot create property 'user' on string")
  const payloadToStore = JSON.stringify(session);
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue = 'base64-' + base64UrlEncode(payloadToStore);
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
  res.cookies.set(cookieName, cookieValue, {
    path: '/',
    expires: new Date(expiresAt * 1000),
    httpOnly: false,
    secure: requestUrl.protocol === 'https:',
    sameSite: 'lax',
  });

  return res;
}
