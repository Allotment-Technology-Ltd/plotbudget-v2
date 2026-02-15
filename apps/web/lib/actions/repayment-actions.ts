'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
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
    revalidatePath('/dashboard/blueprint');
    return { repaymentId: repayment?.id };
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
    const { error } = await (supabase.from('repayments') as any)
      .update(data)
      .eq('id', repaymentId);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update repayment' };
  }
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
