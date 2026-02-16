/**
 * Income source CRUD API client for native app.
 * Calls web app API with Bearer token.
 */

import { createSupabaseClient } from './supabase';

export type FrequencyRule = 'specific_date' | 'last_working_day' | 'every_4_weeks';
export type PaymentSource = 'me' | 'partner' | 'joint';

export interface IncomeSource {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  frequency_rule: FrequencyRule;
  day_of_month: number | null;
  anchor_date: string | null;
  payment_source: PaymentSource;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomeSourcePayload {
  household_id: string;
  name: string;
  amount: number;
  frequency_rule: FrequencyRule;
  day_of_month?: number | null;
  anchor_date?: string | null;
  payment_source: PaymentSource;
  sort_order?: number;
}

export interface UpdateIncomeSourcePayload {
  name?: string;
  amount?: number;
  frequency_rule?: FrequencyRule;
  day_of_month?: number | null;
  anchor_date?: string | null;
  payment_source?: PaymentSource;
  sort_order?: number;
  is_active?: boolean;
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

export async function fetchIncomeSourcesApi(
  householdId: string
): Promise<{ incomeSources: IncomeSource[] } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(
    `${baseUrl}/api/income-sources?household_id=${encodeURIComponent(householdId)}`,
    { headers }
  );

  const json = (await res.json().catch(() => ({}))) as {
    incomeSources?: IncomeSource[];
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return { incomeSources: json.incomeSources ?? [] };
}

export async function createIncomeSourceApi(
  payload: CreateIncomeSourcePayload
): Promise<{ success: true; incomeSourceId?: string } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/income-sources`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    incomeSourceId?: string;
    error?: string;
  };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true, incomeSourceId: json.incomeSourceId } : { error: json.error ?? 'Unknown error' };
}

export async function updateIncomeSourceApi(
  id: string,
  payload: UpdateIncomeSourcePayload
): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/income-sources/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}

export async function deleteIncomeSourceApi(id: string): Promise<{ success: true } | { error: string }> {
  const headers = await getAuthHeaders();
  if (!headers) return { error: 'Not authenticated' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { error: 'EXPO_PUBLIC_APP_URL not configured' };

  const res = await fetch(`${baseUrl}/api/income-sources/${id}`, {
    method: 'DELETE',
    headers,
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { error: json.error ?? `Request failed (${res.status})` };
  return json.success ? { success: true } : { error: json.error ?? 'Unknown error' };
}
