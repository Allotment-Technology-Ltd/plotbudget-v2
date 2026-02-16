/**
 * Mark pot as complete/active API client.
 * Calls web app API with Bearer token for revalidation and data parity.
 */

import { getAuthHeaders } from './auth-headers';

export async function markPotComplete(
  potId: string,
  status: 'complete' | 'active'
): Promise<{ success: true } | { error: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) {
    return { error: 'EXPO_PUBLIC_APP_URL not configured' };
  }

  const headers = await getAuthHeaders();
  if (!headers) {
    return { error: 'Not authenticated' };
  }

  const res = await fetch(`${baseUrl}/api/pots/${potId}/mark-complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }

  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
