/**
 * Mark overdue seeds as paid. Call when loading Blueprint for active cycle.
 */

import { getAuthHeaders } from './auth-headers';

export async function markOverdueSeedsPaid(
  paycycleId: string
): Promise<{ success: true } | { error: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) {
    return { error: 'EXPO_PUBLIC_APP_URL not configured' };
  }

  const headers = await getAuthHeaders();
  if (!headers) {
    return { error: 'Not authenticated' };
  }

  const res = await fetch(`${baseUrl}/api/paycycles/${paycycleId}/mark-overdue`, {
    method: 'POST',
    headers,
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }

  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
