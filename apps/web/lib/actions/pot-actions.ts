'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';

type PotInsert = Database['public']['Tables']['pots']['Insert'];
type PotRow = Database['public']['Tables']['pots']['Row'];

export type PotStatus = 'active' | 'complete' | 'paused';

export interface CreatePotInput {
  household_id: string;
  name: string;
  current_amount: number;
  target_amount: number;
  target_date?: string | null;
  status?: PotStatus;
}

export interface UpdatePotInput {
  name?: string;
  current_amount?: number;
  target_amount?: number;
  target_date?: string | null;
  status?: PotStatus;
}

export async function createPot(
  data: CreatePotInput
): Promise<{ potId?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const insertData: PotInsert = {
      household_id: data.household_id,
      name: data.name,
      current_amount: data.current_amount ?? 0,
      target_amount: data.target_amount,
      target_date: data.target_date ?? null,
      status: data.status ?? 'active',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pot, error } = await (supabase.from('pots') as any)
      .insert(insertData)
      .select('id')
      .single();

    if (error) return { error: error.message };
    revalidatePath('/dashboard/blueprint');
    return { potId: pot?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create pot' };
  }
}

export async function updatePot(
  potId: string,
  data: UpdatePotInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('pots') as any).update(data).eq('id', potId);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update pot' };
  }
}

export async function getPots(householdId: string): Promise<PotRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  return (data ?? []) as PotRow[];
}
