/**
 * Get a one-time URL that logs the user into the web app when opened in a browser.
 * Call this before opening the web app (e.g. Manage account, settings) so they don't have to re-authenticate.
 */

import { createSupabaseClient } from './supabase';
import { getAuthHeaders } from './auth-headers';

const baseUrl = () => process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

/**
 * Returns a URL that, when opened in the browser, will set the web session cookie and redirect.
 * Returns null if not signed in or the API request fails (caller can fall back to opening the plain path).
 * @param path - Web path to redirect to after handoff (e.g. /dashboard/settings). Default /dashboard.
 */
export async function getSessionHandoffUrl(path: string = '/dashboard'): Promise<string | null> {
  const url = baseUrl();
  if (!url) return null;

  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const headers = await getAuthHeaders();
  if (!headers) return null;

  try {
    const res = await fetch(
      `${url}/api/auth/session-from-app?path=${encodeURIComponent(path)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ session }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { url?: string };
    return typeof json.url === 'string' ? json.url : null;
  } catch {
    return null;
  }
}
