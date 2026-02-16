/**
 * Mark overdue seeds as paid. Call when loading Blueprint for active cycle.
 */

import { createSupabaseClient } from './supabase';

export async function markOverdueSeedsPaid(
  paycycleId: string
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

  const res = await fetch(`${baseUrl}/api/paycycles/${paycycleId}/mark-overdue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }

  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
