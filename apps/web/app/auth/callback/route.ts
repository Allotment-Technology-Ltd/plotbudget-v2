import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@repo/supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
import { REDIRECT_AFTER_AUTH_COOKIE } from '@/lib/auth/redirect-after-auth';
import { isEmailAllowed } from '@/lib/auth/allowlist';
import { getOAuthProfileFromUser } from '@/lib/auth/oauth-profile';

/** Sync display name and avatar from OAuth user_metadata into public.users when current value is empty. */
async function syncOAuthProfileToUser(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<void> {
  const oauth = getOAuthProfileFromUser(user);
  if (!oauth.displayName && !oauth.avatarUrl) return;

  const { data: row } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  type Row = { display_name: string | null; avatar_url: string | null };
  const current = row as Row | null;
  const updates: { display_name?: string; avatar_url?: string } = {};
  if (oauth.displayName && !current?.display_name?.trim()) updates.display_name = oauth.displayName;
  if (oauth.avatarUrl && !current?.avatar_url?.trim()) updates.avatar_url = oauth.avatarUrl;
  if (Object.keys(updates).length === 0) return;

  await supabase.from('users').update(updates as never).eq('id', user.id);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const oauthError = requestUrl.searchParams.get('error');

  if (oauthError) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'auth_failed');
    const desc = requestUrl.searchParams.get('error_description');
    if (desc) loginUrl.searchParams.set('error_description', desc);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(loginUrl);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (!isEmailAllowed(user.email ?? '')) {
        await supabase.auth.signOut();
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'allowlist');
        return NextResponse.redirect(loginUrl);
      }
      await syncOAuthProfileToUser(supabase, user);
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
      await logAuditEvent({
        userId: user.id,
        eventType: 'login',
        resource: 'auth',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') ?? null,
      });
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth_failed');
      return NextResponse.redirect(loginUrl);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (!isEmailAllowed(user.email ?? '')) {
        await supabase.auth.signOut();
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'allowlist');
        return NextResponse.redirect(loginUrl);
      }
      await syncOAuthProfileToUser(supabase, user);
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null;
      await logAuditEvent({
        userId: user.id,
        eventType: 'login',
        resource: 'auth',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') ?? null,
      });
    }
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
