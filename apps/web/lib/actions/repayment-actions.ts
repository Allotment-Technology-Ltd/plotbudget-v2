'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { revalidatePath } from 'next/cache';
import type { Database } from '@repo/supabase';

type RepaymentInsert = Database['public']['Tables']['repayments']['Insert'];
type RepaymentRow = Database['public']['Tables']['repayments']['Row'];

export type RepaymentStatus = 'active' | 'paid' | 'paused';

export interface CreateRepaymentInput {
  household_id: string;
  name: string;
  starting_balance: number;
  current_balance: number;
  target_date?: string | null;
  interest_rate?: number | null;
  status?: RepaymentStatus;
}

export interface UpdateRepaymentInput {
  name?: string;
  starting_balance?: number;
  current_balance?: number;
  target_date?: string | null;
  interest_rate?: number | null;
  status?: RepaymentStatus;
}

export async function createRepayment(
  data: CreateRepaymentInput
): Promise<{ repaymentId?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const insertData: RepaymentInsert = {
      household_id: data.household_id,
      name: data.name,
      starting_balance: data.starting_balance,
      current_balance: data.current_balance,
      target_date: data.target_date ?? null,
      interest_rate: data.interest_rate ?? null,
      status: data.status ?? 'active',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: repayment, error } = await (supabase.from('repayments') as any)
      .insert(insertData)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!repayment) return { error: 'Repayment create did not persist. Please try again.' };
    revalidatePath('/dashboard/blueprint');
    return { repaymentId: repayment.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create repayment' };
  }
}

export async function updateRepayment(
  repaymentId: string,
  data: UpdateRepaymentInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from('repayments') as any)
      .update(data)
      .eq('id', repaymentId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!updated) return { error: 'Repayment update did not persist. Please try again.' };
    revalidatePath('/dashboard/blueprint');
    revalidatePath(`/dashboard/forecast/repayment/${repaymentId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update repayment' };
  }
}

/**
 * Delete a repayment (debt). Seeds linked to this repayment will have linked_repayment_id set to null (DB ON DELETE SET NULL).
 * Caller must belong to the repayment's household (owner or partner).
 */
export async function deleteRepayment(
  repaymentId: string,
  client?: SupabaseClient<Database>
): Promise<{ success: true } | { error: string }> {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: repayData, error: repayError } = await supabase
    .from('repayments')
    .select('household_id')
    .eq('id', repaymentId)
    .single();

  if (repayError || !repayData) {
    return { error: 'Repayment not found' };
  }

  const repayment = repayData as { household_id: string };
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle()) as { data: { household_id: string | null } | null };

  const ownHousehold = profile?.household_id === repayment.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === repayment.household_id;
  if (!ownHousehold && !partnerHousehold) {
    return { error: 'Repayment not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deleted, error: deleteError } = await (supabase.from('repayments') as any)
    .delete()
    .eq('id', repaymentId)
    .select('id')
    .single();
  if (deleteError) return { error: deleteError.message };
  if (!deleted) return { error: 'Repayment delete did not persist. Please try again.' };
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getRepayments(
  householdId: string
): Promise<RepaymentRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('repayments')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  return (data ?? []) as RepaymentRow[];
}
