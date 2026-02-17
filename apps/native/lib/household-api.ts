/**
 * Household API client for native app (e.g. update category split percentages).
 * Calls web app API with Bearer token.
 */

import { getAuthHeaders } from './auth-headers';

export interface UpdatePercentagesPayload {
  needs_percent: number;
  wants_percent: number;
  savings_percent: number;
  repay_percent: number;
}

const NETWORK_ERROR_MESSAGE =
  'Cannot reach the web app. On Android emulator use EXPO_PUBLIC_APP_URL=http://10.0.2.2:3000 in .env.local and run the web app on your machine.';

function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /network request failed|failed to fetch|network error/i.test(msg);
}

function toApiError(e: unknown): string {
  if (isNetworkError(e)) return NETWORK_ERROR_MESSAGE;
  return e instanceof Error ? e.message : 'Request failed';
}

export async function updateHouseholdPercentagesApi(
  householdId: string,
  data: UpdatePercentagesPayload
): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  try {
    const res = await fetch(`${baseUrl}/api/households/${householdId}/percentages`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
  } catch (e) {
    return { error: toApiError(e) };
  }
}
