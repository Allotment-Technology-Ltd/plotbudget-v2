/**
 * Remove push tokens for the current user from the backend (e.g. when user disables notifications).
 * Kept in a separate file so Settings can import it without pulling in expo-notifications,
 * which is not available in Expo Go (SDK 53+).
 */

import { getAuthHeaders } from './auth-headers';

export async function unregisterPushToken(): Promise<{ ok: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { ok: false, error: 'Not signed in' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { ok: false, error: 'EXPO_PUBLIC_APP_URL not set' };

  const res = await fetch(`${baseUrl}/api/push-tokens`, {
    method: 'DELETE',
    headers: { Authorization: headers.Authorization },
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: json.error ?? `Request failed (${res.status})` };
  return { ok: true };
}
