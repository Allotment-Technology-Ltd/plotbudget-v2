/**
 * Forecast lock-in API client for native app.
 */

import { getAuthHeaders } from './auth-headers';

export async function lockInForecastApi(
  params: {
    potId?: string | null;
    repaymentId?: string | null;
    amount: number;
    name: string;
    type: 'savings' | 'repay';
  }
): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  try {
    const res = await fetch(`${baseUrl}/api/forecast/lock-in`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const json = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      error?: string;
    };
    if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
    return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: /network|fetch/i.test(msg) ? 'Cannot reach the web app.' : msg };
  }
}
