'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { revalidatePath } from 'next/cache';
import type { Database } from '@repo/supabase';

type SeedRow = Database['public']['Tables']['seeds']['Row'];
type PaycycleRow = Database['public']['Tables']['paycycles']['Row'];
type SeedUpdate = Database['public']['Tables']['seeds']['Update'];

type Payer = 'me' | 'partner' | 'both';
type SeedType = 'need' | 'want' | 'savings' | 'repay';

/** Map seed type to paycycle rem_ field prefix (needs, wants, savings, repay) */
function getRemTypeKey(type: SeedType): string {
  return type === 'need' ? 'needs' : type === 'want' ? 'wants' : type === 'savings' ? 'savings' : 'repay';
}

/** Amount being marked paid for the given payer (matches updatePaycycleRemaining logic). */
function getPaidAmount(seed: SeedRow, payer: Payer): number {
  if (payer === 'both' || seed.payment_source !== 'joint') {
    if (seed.payment_source === 'me' || seed.payment_source === 'partner') {
      return Number(seed.amount);
    }
    return Number(seed.amount_me ?? 0) + Number(seed.amount_partner ?? 0);
  }
  if (payer === 'me') return Number(seed.amount_me ?? 0);
  return Number(seed.amount_partner ?? 0);
}

/**
 * Update linked pot (savings) or repayment (debt) when a seed is marked or unmarked paid.
 * Mark paid: savings += amount, repay -= amount.
 * Unmark paid: savings -= amount, repay += amount.
 * Exported for use by markOverdueSeedsPaid in seed-actions.
 */
export async function updateLinkedPotOrRepayment(
  seed: SeedRow,
  payer: Payer,
  markingPaid: boolean,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? (await createServerSupabaseClient());
  const amount = getPaidAmount(seed, payer);
  if (amount <= 0) return;

  if (seed.type === 'savings' && seed.linked_pot_id) {
    const { data: pot } = await supabase
      .from('pots')
      .select('current_amount')
      .eq('id', seed.linked_pot_id)
      .single();
    if (!pot) return;
    const current = Number((pot as { current_amount: number }).current_amount ?? 0);
    const next = markingPaid ? current + amount : Math.max(0, current - amount);
    await (supabase.from('pots') as any)
      .update({ current_amount: next, updated_at: new Date().toISOString() })
      .eq('id', seed.linked_pot_id);
  }

  if (seed.type === 'repay' && seed.linked_repayment_id) {
    const { data: repayment } = await supabase
      .from('repayments')
      .select('current_balance')
      .eq('id', seed.linked_repayment_id)
      .single();
    if (!repayment) return;
    const current = Number((repayment as { current_balance: number }).current_balance ?? 0);
    const next = markingPaid ? Math.max(0, current - amount) : current + amount;
    await (supabase.from('repayments') as any)
      .update({ current_balance: next, updated_at: new Date().toISOString() })
      .eq('id', seed.linked_repayment_id);
  }
}

/**
 * Decrement paycycle remaining amounts when a seed is marked paid.
 * Business rules: ME/PARTNER seeds decrement rem_{type}_me or rem_{type}_partner by amount.
 * JOINT seeds decrement rem_{type}_me by amount_me and rem_{type}_partner by amount_partner (when each portion is marked).
 */
async function updatePaycycleRemaining(
  seed: SeedRow,
  payer: Payer,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? (await createServerSupabaseClient());

  const { data: paycycle } = await supabase
    .from('paycycles')
    .select('*')
    .eq('id', seed.paycycle_id)
    .single();

  if (!paycycle) return;

  const typeKey = getRemTypeKey(seed.type);
  const updates: Partial<PaycycleRow> = {};

  if (payer === 'both' || seed.payment_source !== 'joint') {
    if (seed.payment_source === 'me') {
      const field = `rem_${typeKey}_me` as keyof PaycycleRow;
      (updates as Record<string, number>)[field] = Math.max(
        0,
        Number(paycycle[field]) - Number(seed.amount)
      );
    } else if (seed.payment_source === 'partner') {
      const field = `rem_${typeKey}_partner` as keyof PaycycleRow;
      (updates as Record<string, number>)[field] = Math.max(
        0,
        Number(paycycle[field]) - Number(seed.amount)
      );
    } else {
      const fieldMe = `rem_${typeKey}_me` as keyof PaycycleRow;
      const fieldPartner = `rem_${typeKey}_partner` as keyof PaycycleRow;
      (updates as Record<string, number>)[fieldMe] = Math.max(
        0,
        Number(paycycle[fieldMe]) - Number(seed.amount_me)
      );
      (updates as Record<string, number>)[fieldPartner] = Math.max(
        0,
        Number(paycycle[fieldPartner]) - Number(seed.amount_partner)
      );
    }
  } else if (payer === 'me') {
    const field = `rem_${typeKey}_me` as keyof PaycycleRow;
    (updates as Record<string, number>)[field] = Math.max(
      0,
      Number(paycycle[field]) - Number(seed.amount_me)
    );
  } else if (payer === 'partner') {
    const field = `rem_${typeKey}_partner` as keyof PaycycleRow;
    (updates as Record<string, number>)[field] = Math.max(
      0,
      Number(paycycle[field]) - Number(seed.amount_partner)
    );
  }

  if (Object.keys(updates).length > 0) {
    await (supabase.from('paycycles') as any).update(updates).eq('id', seed.paycycle_id);
  }
}

/**
 * Increment paycycle remaining amounts when a seed is unmarked paid (reverse of updatePaycycleRemaining).
 */
async function incrementPaycycleRemaining(
  seed: SeedRow,
  payer: Payer,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? (await createServerSupabaseClient());

  const { data: paycycle } = await supabase
    .from('paycycles')
    .select('*')
    .eq('id', seed.paycycle_id)
    .single();

  if (!paycycle) return;

  const typeKey = getRemTypeKey(seed.type);
  const updates: Partial<PaycycleRow> = {};

  if (payer === 'both' || seed.payment_source !== 'joint') {
    if (seed.payment_source === 'me') {
      const field = `rem_${typeKey}_me` as keyof PaycycleRow;
      (updates as Record<string, number>)[field] =
        Number(paycycle[field]) + Number(seed.amount);
    } else if (seed.payment_source === 'partner') {
      const field = `rem_${typeKey}_partner` as keyof PaycycleRow;
      (updates as Record<string, number>)[field] =
        Number(paycycle[field]) + Number(seed.amount);
    } else {
      const fieldMe = `rem_${typeKey}_me` as keyof PaycycleRow;
      const fieldPartner = `rem_${typeKey}_partner` as keyof PaycycleRow;
      (updates as Record<string, number>)[fieldMe] =
        Number(paycycle[fieldMe]) + Number(seed.amount_me);
      (updates as Record<string, number>)[fieldPartner] =
        Number(paycycle[fieldPartner]) + Number(seed.amount_partner);
    }
  } else if (payer === 'me') {
    const field = `rem_${typeKey}_me` as keyof PaycycleRow;
    (updates as Record<string, number>)[field] =
      Number(paycycle[field]) + Number(seed.amount_me);
  } else if (payer === 'partner') {
    const field = `rem_${typeKey}_partner` as keyof PaycycleRow;
    (updates as Record<string, number>)[field] =
      Number(paycycle[field]) + Number(seed.amount_partner);
  }

  if (Object.keys(updates).length > 0) {
    await (supabase.from('paycycles') as any).update(updates).eq('id', seed.paycycle_id);
  }
}

/**
 * Mark a seed (or portion) as paid. Updates is_paid / is_paid_me / is_paid_partner
 * and decrements paycycle remaining amounts.
 * @param client Optional Supabase client (e.g. from API route with Bearer token). When omitted, uses server cookies.
 */
export async function markSeedPaid(
  seedId: string,
  payer: Payer,
  client?: SupabaseClient<Database>
): Promise<{ success: true } | { error: string }> {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: seedDataRes, error: seedError } = await supabase
    .from('seeds')
    .select('*')
    .eq('id', seedId)
    .single();

  if (seedError || !seedDataRes) {
    return { error: 'Seed not found' };
  }

  const seed = seedDataRes as SeedRow;
  if (isPartner && partnerHouseholdId && seed.household_id !== partnerHouseholdId) {
    return { error: 'Seed not found' };
  }

  const updates: SeedUpdate = {};

  if (payer === 'both' || seed.payment_source !== 'joint') {
    updates.is_paid = true;
    updates.is_paid_me = true;
    updates.is_paid_partner = seed.payment_source === 'joint';
  } else if (payer === 'me') {
    updates.is_paid_me = true;
    if (seed.is_paid_partner) {
      updates.is_paid = true;
    }
  } else if (payer === 'partner') {
    updates.is_paid_partner = true;
    if (seed.is_paid_me) {
      updates.is_paid = true;
    }
  }

  const { error: updateError } = await (supabase.from('seeds') as any)
    .update(updates)
    .eq('id', seedId);

  if (updateError) {
    return { error: (updateError as { message: string }).message };
  }

  await updatePaycycleRemaining(seed, payer);
  await updateLinkedPotOrRepayment(seed, payer, true, supabase);
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Unmark a seed (or portion) as paid. Reverses is_paid flags and increments paycycle remaining.
 * @param client Optional Supabase client (e.g. from API route with Bearer token). When omitted, uses server cookies.
 */
export async function unmarkSeedPaid(
  seedId: string,
  payer: Payer,
  client?: SupabaseClient<Database>
): Promise<{ success: true } | { error: string }> {
  const supabase = client ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: seedDataRes, error: seedError } = await supabase
    .from('seeds')
    .select('*')
    .eq('id', seedId)
    .single();

  if (seedError || !seedDataRes) {
    return { error: 'Seed not found' };
  }

  const seed = seedDataRes as SeedRow;
  if (isPartner && partnerHouseholdId && seed.household_id !== partnerHouseholdId) {
    return { error: 'Seed not found' };
  }

  const updates: SeedUpdate = {};

  if (payer === 'both' || seed.payment_source !== 'joint') {
    updates.is_paid = false;
    updates.is_paid_me = false;
    updates.is_paid_partner = false;
  } else if (payer === 'me') {
    updates.is_paid_me = false;
    updates.is_paid = false;
  } else if (payer === 'partner') {
    updates.is_paid_partner = false;
    updates.is_paid = false;
  }

  const { error: updateError } = await (supabase.from('seeds') as any)
    .update(updates)
    .eq('id', seedId);

  if (updateError) {
    return { error: (updateError as { message: string }).message };
  }

  await incrementPaycycleRemaining(seed, payer);
  await updateLinkedPotOrRepayment(seed, payer, false, supabase);
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Close the cycle ritual: lock the budget for this paycycle (user-triggered dopamine moment).
 */
export async function closeRitual(
  paycycleId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: paycycleData } = await supabase
    .from('paycycles')
    .select('household_id')
    .eq('id', paycycleId)
    .single();

  const paycycle = paycycleData as { household_id: string } | null;
  if (!paycycle) return { error: 'Paycycle not found' };

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  const profileRow = profile as { household_id: string | null } | null;
  const ownHousehold = profileRow?.household_id === paycycle.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === paycycle.household_id;
  if (!ownHousehold && !partnerHousehold) return { error: 'Paycycle not found' };

  const { error } = await (supabase.from('paycycles') as any)
    .update({ ritual_closed_at: new Date().toISOString() })
    .eq('id', paycycleId);

  if (error) return { error: (error as { message: string }).message };
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Unlock the cycle so the user can edit again (e.g. new bill came in).
 */
export async function unlockRitual(
  paycycleId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return { error: 'Not authenticated' };

  const { data: paycycleData } = await supabase
    .from('paycycles')
    .select('household_id')
    .eq('id', paycycleId)
    .single();

  const paycycle = paycycleData as { household_id: string } | null;
  if (!paycycle) return { error: 'Paycycle not found' };

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  const profileRow = profile as { household_id: string | null } | null;
  const ownHousehold = profileRow?.household_id === paycycle.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === paycycle.household_id;
  if (!ownHousehold && !partnerHousehold) return { error: 'Paycycle not found' };

  const { error } = await (supabase.from('paycycles') as any)
    .update({ ritual_closed_at: null })
    .eq('id', paycycleId);

  if (error) return { error: (error as { message: string }).message };
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  return { success: true };
}

/** Resolve authenticated user and household id for start-next-cycle flow. */
async function resolveHouseholdForNextCycle(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<{ householdId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(
    supabase,
    user?.id ?? null
  );
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .maybeSingle();
  const profileRow = profile as { household_id: string | null } | null;
  const householdId = profileRow?.household_id ?? (isPartner ? partnerHouseholdId : null);
  if (!householdId) return { error: 'No household' };
  return { householdId };
}

/** Fetch active and draft paycycles for the household. */
async function getActiveAndDraftCycles(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  householdId: string
): Promise<
  | { activeCycle: { id: string }; draftCycle: { id: string } | null }
  | { error: string }
> {
  const { data: activeRow } = await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .maybeSingle();
  const activeCycle = activeRow as { id: string } | null;
  if (!activeCycle) return { error: 'No active pay cycle' };

  const { data: draftRow } = await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'draft')
    .maybeSingle();
  const draftCycle = draftRow as { id: string } | null;
  return { activeCycle, draftCycle };
}

/** Activate existing draft or create a new cycle; return the new active cycle id. */
async function activateDraftOrCreateNext(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  activeCycleId: string,
  draftCycle: { id: string } | null
): Promise<{ newActiveId: string } | { error: string }> {
  const now = new Date().toISOString();
  if (draftCycle) {
    const { error: activateErr } = await (supabase.from('paycycles') as any)
      .update({ status: 'active', updated_at: now })
      .eq('id', draftCycle.id);
    if (activateErr) return { error: (activateErr as { message: string }).message };
    return { newActiveId: draftCycle.id };
  }
  const { createNextPaycycleCore } = await import(
    '@/lib/paycycle/create-next-paycycle-core'
  );
  const result = await createNextPaycycleCore(supabase, activeCycleId, {
    status: 'active',
  });
  if (result.error || !result.cycleId)
    return { error: result.error ?? 'Failed to create next cycle' };
  return { newActiveId: result.cycleId };
}

/** Mark active cycle completed and set all household members' current_paycycle_id. */
async function completeActiveAndSetMembersCurrent(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  activeCycleId: string,
  newActiveId: string,
  householdId: string
): Promise<{ error?: string }> {
  const now = new Date().toISOString();
  const { error: completeErr } = await (supabase.from('paycycles') as any)
    .update({
      status: 'completed',
      ritual_closed_at: now,
      updated_at: now,
    })
    .eq('id', activeCycleId);
  if (completeErr) return { error: (completeErr as { message: string }).message };

  const { data: members } = await supabase
    .from('users')
    .select('id')
    .eq('household_id', householdId);
  const memberIds = (members ?? []).map((m: { id: string }) => m.id);
  if (memberIds.length > 0) {
    await (supabase.from('users') as any)
      .update({ current_paycycle_id: newActiveId, updated_at: now })
      .in('id', memberIds);
  }
  return {};
}

function revalidateNextCyclePaths(): void {
  revalidatePath('/dashboard/blueprint');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/payday-complete');
}

/**
 * Start the next pay cycle: mark current active as completed, then either activate
 * the existing draft or create a new cycle from the completed one and set it active.
 * Updates all household members' current_paycycle_id. Used by the payday-complete ritual.
 */
export async function startNextCycle(): Promise<
  { success: true; newCycleId: string } | { error: string }
> {
  const supabase = await createServerSupabaseClient();
  const auth = await resolveHouseholdForNextCycle(supabase);
  if ('error' in auth) return { error: auth.error };

  const cycles = await getActiveAndDraftCycles(supabase, auth.householdId);
  if ('error' in cycles) return { error: cycles.error };

  const next = await activateDraftOrCreateNext(
    supabase,
    cycles.activeCycle.id,
    cycles.draftCycle
  );
  if ('error' in next) return { error: next.error };

  const complete = await completeActiveAndSetMembersCurrent(
    supabase,
    cycles.activeCycle.id,
    next.newActiveId,
    auth.householdId
  );
  if (complete.error) return { error: complete.error };

  revalidateNextCyclePaths();
  return { success: true, newCycleId: next.newActiveId };
}
