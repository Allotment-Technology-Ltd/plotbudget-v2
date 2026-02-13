/**
 * Test-only auth helper. Programmatically signs in via Supabase (Node) and injects
 * the session cookie into the Playwright browser context. Mirrors global-setup logic
 * so tests can obtain a logged-in session without using the login UI.
 */
import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const cookieName = `sb-${projectRef}-auth-token`;

/**
 * Signs in with the given credentials via Supabase and injects the session cookie
 * into the page's browser context. Call this before navigating to protected routes.
 */
export async function setAuthState(page: Page, email: string, password: string): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`setAuthState: sign in failed for ${email}: ${error.message}`);
  }
  if (!session) {
    throw new Error(`setAuthState: no session for ${email}`);
  }

  const cookieValue =
    'base64-' + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url');
  const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

  const ctx = page.context() as { options?: { baseURL?: string } };
  const baseURL = ctx.options?.baseURL ?? 'http://localhost:3000';
  const url = new URL(baseURL);
  const domain = url.hostname;
  const secure = url.protocol === 'https:';

  await page.context().addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain,
      path: '/',
      expires: expiresAt,
      httpOnly: false,
      secure,
      sameSite: 'Lax',
    },
  ]);
}
