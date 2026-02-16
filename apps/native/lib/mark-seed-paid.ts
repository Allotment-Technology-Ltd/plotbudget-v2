/**
 * Mark/unmark seed as paid API client.
 * Calls web app API with Bearer token for revalidation and data parity.
 * Supports payer: 'me' | 'partner' | 'both' for joint seeds.
 */

import { getAuthHeaders } from './auth-headers';

export type Payer = 'me' | 'partner' | 'both';

async function seedPaidRequest(
  seedId: string,
  payer: Payer,
  endpoint: 'mark-paid' | 'unmark-paid'
): Promise<{ success: true } | { error: string }> {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) {
    return { error: 'EXPO_PUBLIC_APP_URL not configured' };
  }

  const headers = await getAuthHeaders();
  if (!headers) {
    return { error: 'Not authenticated' };
  }

  const res = await fetch(`${baseUrl}/api/seeds/${seedId}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ payer }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };

  if (!res.ok) {
    return { error: json.error ?? `Request failed (${res.status})` };
  }

  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}

export async function markSeedPaid(
  seedId: string,
  payer: Payer = 'both'
): Promise<{ success: true } | { error: string }> {
  return seedPaidRequest(seedId, payer, 'mark-paid');
}

export async function unmarkSeedPaid(
  seedId: string,
  payer: Payer = 'both'
): Promise<{ success: true } | { error: string }> {
  return seedPaidRequest(seedId, payer, 'unmark-paid');
}
