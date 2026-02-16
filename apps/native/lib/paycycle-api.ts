/**
 * Paycycle API client: create next (draft), close ritual, unlock ritual, resync draft.
 * Calls web app API with Bearer token. Same business logic as web blueprint.
 */

import { getAuthHeaders } from './auth-headers';

const baseUrl = () => process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';

async function authFetch(
  path: string,
  options: { method: string; body?: string } = { method: 'GET' }
): Promise<{ success: true; cycleId?: string } | { error: string }> {
  const url = baseUrl();
  if (!url) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const res = await fetch(`${url}${path}`, {
    method: options.method,
    headers,
    body: options.body,
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; cycleId?: string; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return { success: true, ...(json.cycleId && { cycleId: json.cycleId }) };
}

/** Create next paycycle as draft. Returns new cycleId on success. */
export async function createNextPaycycle(
  currentPaycycleId: string
): Promise<{ success: true; cycleId: string } | { error: string }> {
  const result = await authFetch('/api/paycycles/next', {
    method: 'POST',
    body: JSON.stringify({ currentPaycycleId }),
  });
  if ('error' in result) return result;
  if (!result.cycleId) return { error: 'No cycleId returned' };
  return { success: true, cycleId: result.cycleId };
}

/** Close the cycle ritual (lock budget). */
export async function closeRitual(paycycleId: string): Promise<{ success: true } | { error: string }> {
  return authFetch(`/api/paycycles/${paycycleId}/close-ritual`, { method: 'POST' });
}

/** Unlock the cycle so user can edit again. */
export async function unlockRitual(paycycleId: string): Promise<{ success: true } | { error: string }> {
  return authFetch(`/api/paycycles/${paycycleId}/unlock-ritual`, { method: 'POST' });
}

/** Resync draft from active (recurring seeds). */
export async function resyncDraft(
  draftPaycycleId: string,
  activePaycycleId: string
): Promise<{ success: true } | { error: string }> {
  return authFetch(`/api/paycycles/${draftPaycycleId}/resync-draft`, {
    method: 'POST',
    body: JSON.stringify({ activePaycycleId }),
  });
}
