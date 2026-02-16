/**
 * Sync push notification preferences to the backend so sends are filtered by type.
 * Does not import expo-notifications (safe for Expo Go).
 */

import type { PushPreferenceFlags } from '@/contexts/PushPreferencesContext';
import { getAuthHeaders } from './auth-headers';

export async function updatePushPreferences(
  preferences: PushPreferenceFlags
): Promise<{ ok: boolean; error?: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { ok: false, error: 'Not signed in' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { ok: false, error: 'EXPO_PUBLIC_APP_URL not set' };

  const res = await fetch(`${baseUrl}/api/push-tokens/preferences`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      paydayReminders: preferences.paydayReminders,
      partnerActivity: preferences.partnerActivity,
      billsMarkedPaid: preferences.billsMarkedPaid,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: json.error ?? `Request failed (${res.status})` };
  return { ok: true };
}
