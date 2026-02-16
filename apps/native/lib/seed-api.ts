/**
 * Seed CRUD API client for native app.
 * Calls web app API with Bearer token.
 */

import { createSupabaseClient } from './supabase';

type SeedType = 'need' | 'want' | 'savings' | 'repay';
type PaymentSource = 'me' | 'partner' | 'joint';

export interface CreateSeedPayload {
  name: string;
  amount: number;
  type: SeedType;
  payment_source: PaymentSource;
  paycycle_id: string;
  household_id: string;
  is_recurring?: boolean;
  split_ratio?: number;
  uses_joint_account?: boolean;
  due_date?: string | null;
  linked_pot_id?: string | null;
  linked_repayment_id?: string | null;
  pot?: {
    current_amount: number;
    target_amount: number;
    target_date: string | null;
    status: 'active' | 'complete' | 'paused';
  };
  repayment?: {
    starting_balance: number;
    current_balance: number;
    target_date: string | null;
    status: 'active' | 'paid' | 'paused';
  };
}

export interface UpdateSeedPayload {
  name?: string;
  amount?: number;
  payment_source?: PaymentSource;
  split_ratio?: number | null;
  uses_joint_account?: boolean;
  is_recurring?: boolean;
  due_date?: string | null;
  linked_pot_id?: string | null;
  linked_repayment_id?: string | null;
  pot?: {
    current_amount?: number;
    target_amount?: number;
    target_date?: string | null;
    status?: 'active' | 'complete' | 'paused';
  };
  repayment?: {
    current_balance?: number;
    target_date?: string | null;
    status?: 'active' | 'paid' | 'paused';
  };
}

async function getAuthHeaders(): Promise<{ 'Content-Type': string; Authorization: string } | null> {
  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return null;

  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function createSeedApi(
  payload: CreateSeedPayload
): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/seeds`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, is_recurring: payload.is_recurring ?? true }),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}

export async function updateSeedApi(
  seedId: string,
  payload: UpdateSeedPayload
): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/seeds/${seedId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}

export async function deleteSeedApi(seedId: string): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/seeds/${seedId}`, {
    method: 'DELETE',
    headers,
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
