'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { revalidatePath } from 'next/cache';
import type { Database } from '@repo/supabase';

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
    if (!pot) return { error: 'Pot create did not persist. Please try again.' };
    revalidatePath('/dashboard/money/blueprint');
    return { potId: pot.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create pot' };
  }
}

export async function updatePot(
  potId: string,
  data: UpdatePotInput,
  client?: SupabaseClient<Database>
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from('pots') as any)
      .update(data)
      .eq('id', potId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!updated) return { error: 'Pot update did not persist. Please try again.' };
    revalidatePath('/dashboard/money/blueprint');
    revalidatePath('/dashboard');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update pot' };
  }
}

/**
 * Mark a pot as complete (accomplished) or active. Used by native app and API routes.
 * @param client Optional Supabase client (e.g. from API route with Bearer token).
 */
export async function markPotComplete(
  potId: string,
  status: 'complete' | 'active',
  client?: SupabaseClient<Database>
): Promise<{ success: true } | { error: string }> {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: potData, error: potError } = await supabase
    .from('pots')
    .select('household_id')
    .eq('id', potId)
    .single();

  if (potError || !potData) {
    return { error: 'Pot not found' };
  }

  const pot = potData as { household_id: string };
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle()) as { data: { household_id: string | null } | null };

  const ownHousehold = profile?.household_id === pot.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === pot.household_id;
  if (!ownHousehold && !partnerHousehold) {
    return { error: 'Pot not found' };
  }

  const updateResult = await updatePot(potId, { status }, supabase);
  if (updateResult.error) return { error: updateResult.error };
  return { success: true };
}

/**
 * Delete a pot (savings goal). Seeds linked to this pot will have linked_pot_id set to null (DB ON DELETE SET NULL).
 * Caller must belong to the pot's household (owner or partner).
 */
export async function deletePot(
  potId: string,
  client?: SupabaseClient<Database>
): Promise<{ success: true } | { error: string }> {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: potData, error: potError } = await supabase
    .from('pots')
    .select('household_id')
    .eq('id', potId)
    .single();

  if (potError || !potData) {
    return { error: 'Pot not found' };
  }

  const pot = potData as { household_id: string };
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle()) as { data: { household_id: string | null } | null };

  const ownHousehold = profile?.household_id === pot.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === pot.household_id;
  if (!ownHousehold && !partnerHousehold) {
    return { error: 'Pot not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deleted, error: deleteError } = await (supabase.from('pots') as any)
    .delete()
    .eq('id', potId)
    .select('id')
    .single();
  if (deleteError) return { error: deleteError.message };
  if (!deleted) return { error: 'Pot delete did not persist. Please try again.' };
  revalidatePath('/dashboard/money/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
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
