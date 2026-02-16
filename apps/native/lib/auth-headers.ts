/**
 * Auth headers for calling web app API from native (Bearer token).
 * Refreshes the session before returning so the access token is valid server-side.
 */

import { createSupabaseClient } from './supabase';

/**
 * Returns { Authorization, 'Content-Type' } for fetch(), or null if not signed in.
 * Refreshes the session first so the server receives a valid (non-expired) JWT when possible.
 */
export async function getAuthHeaders(): Promise<
  { 'Content-Type': string; Authorization: string } | null
> {
  const supabase = createSupabaseClient();
  try {
    await supabase.auth.refreshSession();
  } catch (err) {
    // Proceed with cached session if refresh fails (e.g. offline)
    if (__DEV__) console.warn('[auth-headers] refreshSession failed:', err);
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}
