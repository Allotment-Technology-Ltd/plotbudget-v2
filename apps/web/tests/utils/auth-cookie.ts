// apps/web/tests/utils/auth-cookie.ts
// Programmatic auth cookie for E2E tests that need a logged-in user without using the login UI.
import path from 'path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { TEST_USERS } from '../fixtures/test-data';

loadEnv({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
loadEnv({ path: path.resolve(process.cwd(), '.env.test.local'), quiet: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Signs in as the partner test user via Supabase (Node) and returns a cookie
 * object suitable for Playwright's context.addCookies().
 * Use when a test needs "partner logged in" without going through the login form.
 */
export async function getPartnerAuthCookie(
  baseURL: string = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
): Promise<{ name: string; value: string; domain: string; path: string; expires: number; httpOnly: boolean; secure: boolean; sameSite: 'Lax' }> {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  const domain = new URL(baseURL).hostname;
  const secure = new URL(baseURL).protocol === 'https:';

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email: TEST_USERS.partner.email,
    password: TEST_USERS.partner.password,
  });

  if (error) {
    throw new Error(`getPartnerAuthCookie: sign in failed: ${error.message}`);
  }
  if (!session) {
    throw new Error('getPartnerAuthCookie: no session returned');
  }

  const cookieValue =
    'base64-' + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url');
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

  return {
    name: cookieName,
    value: cookieValue,
    domain,
    path: '/',
    expires: expiresAt,
    httpOnly: false,
    secure,
    sameSite: 'Lax',
  };
}
