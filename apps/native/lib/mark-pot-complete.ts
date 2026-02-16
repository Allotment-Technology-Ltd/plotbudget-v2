/**
 * Mark pot as complete/active API client.
 * Calls web app API with Bearer token for revalidation and data parity.
 */

import { createSupabaseClient } from './supabase';

export async function markPotComplete(
  potId: string,
  status: 'complete' | 'active'
): Promise<{ success: true } | { error: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) {
    return { error: 'EXPO_PUBLIC_APP_URL not configured' };
  }

  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: 'Not authenticated' };
  }

  const res = await fetch(`${baseUrl}/api/pots/${potId}/mark-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ status }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }

  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
