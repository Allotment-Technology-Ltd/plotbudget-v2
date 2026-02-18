'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { revalidatePath } from 'next/cache';
import { validateDueDateInCycle } from '@/lib/utils/date-cycle-validation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
type SeedRow = Database['public']['Tables']['seeds']['Row'];
type SeedInsert = Database['public']['Tables']['seeds']['Insert'];

type SeedType = 'need' | 'want' | 'savings' | 'repay';
type PaymentSource = 'me' | 'partner' | 'joint';

export interface CreateSeedInput {
  name: string;
  amount: number;
  type: SeedType;
  payment_source: PaymentSource;
  split_ratio?: number | null;
  uses_joint_account?: boolean;
  is_recurring: boolean;
  due_date?: string | null;
  paycycle_id: string;
  household_id: string;
  linked_pot_id?: string | null;
  linked_repayment_id?: string | null;
  /** Inline pot for savings: create pot and link */
  pot?: {
    current_amount: number;
    target_amount: number;
    target_date: string | null;
    status: 'active' | 'complete' | 'paused';
  };
  /** Inline repayment for repay: create repayment and link */
  repayment?: {
    starting_balance: number;
    current_balance: number;
    target_date: string | null;
    status: 'active' | 'paid' | 'paused';
    interest_rate?: number | null;
  };
}

export interface UpdateSeedInput {
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
    /** Required when creating a repayment on update (user added optional debt info after creation). */
    starting_balance?: number;
    current_balance?: number;
    target_date?: string | null;
    status?: 'active' | 'paid' | 'paused';
    interest_rate?: number | null;
  };
}

/** Calculate amount_me and amount_partner for a seed based on payment_source and split ratio */
function calculateSeedSplit(
  totalAmount: number,
  paymentSource: PaymentSource,
  seedSplitRatio: number | null | undefined,
  householdJointRatio: number
): { amount_me: number; amount_partner: number } {
  if (paymentSource === 'me') {
    return { amount_me: totalAmount, amount_partner: 0 };
  }
  if (paymentSource === 'partner') {
    return { amount_me: 0, amount_partner: totalAmount };
  }
  const effectiveRatio = seedSplitRatio ?? householdJointRatio ?? 0.5;
  const amount_me = totalAmount * effectiveRatio;
  const amount_partner = totalAmount - amount_me;
  return { amount_me, amount_partner };
}

/** Recalculate and update all paycycle allocation and remaining columns from seeds */
export async function updatePaycycleAllocations(
  paycycleId: string,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? (await createServerSupabaseClient());

  const { data: seedsData } = await supabase
    .from('seeds')
    .select('*')
    .eq('paycycle_id', paycycleId);

  const seeds = (seedsData ?? []) as SeedRow[];

  const totals: Record<string, number> = {
    total_allocated: 0,
    alloc_needs_me: 0,
    alloc_needs_partner: 0,
    alloc_needs_joint: 0,
    alloc_wants_me: 0,
    alloc_wants_partner: 0,
    alloc_wants_joint: 0,
    alloc_savings_me: 0,
    alloc_savings_partner: 0,
    alloc_savings_joint: 0,
    alloc_repay_me: 0,
    alloc_repay_partner: 0,
    alloc_repay_joint: 0,
    rem_needs_me: 0,
    rem_needs_partner: 0,
    rem_needs_joint: 0,
    rem_wants_me: 0,
    rem_wants_partner: 0,
    rem_wants_joint: 0,
    rem_savings_me: 0,
    rem_savings_partner: 0,
    rem_savings_joint: 0,
    rem_repay_me: 0,
    rem_repay_partner: 0,
    rem_repay_joint: 0,
  };

  const typeMap = {
    need: 'needs',
    want: 'wants',
    savings: 'savings',
    repay: 'repay',
  } as const;

  seeds.forEach((seed) => {
    const typeKey = typeMap[seed.type];
    const sourceKey = seed.payment_source;

    totals.total_allocated += seed.amount;

    const allocKey = `alloc_${typeKey}_${sourceKey}` as keyof typeof totals;
    totals[allocKey] = (totals[allocKey] ?? 0) + seed.amount;
  });

  const remTotals: Record<string, number> = {
    rem_needs_me: 0,
    rem_needs_partner: 0,
    rem_needs_joint: 0,
    rem_wants_me: 0,
    rem_wants_partner: 0,
    rem_wants_joint: 0,
    rem_savings_me: 0,
    rem_savings_partner: 0,
    rem_savings_joint: 0,
    rem_repay_me: 0,
    rem_repay_partner: 0,
    rem_repay_joint: 0,
  };

  seeds.forEach((seed) => {
    const typeKey = typeMap[seed.type];
    if (seed.payment_source === 'me') {
      const key = `rem_${typeKey}_me` as keyof typeof remTotals;
      remTotals[key] += seed.is_paid ? 0 : seed.amount;
    } else if (seed.payment_source === 'partner') {
      const key = `rem_${typeKey}_partner` as keyof typeof remTotals;
      remTotals[key] += seed.is_paid ? 0 : seed.amount;
    } else {
      const unpaidMe = seed.is_paid_me ? 0 : seed.amount_me;
      const unpaidPartner = seed.is_paid_partner ? 0 : seed.amount_partner;
      const key = `rem_${typeKey}_joint` as keyof typeof remTotals;
      remTotals[key] += unpaidMe + unpaidPartner;
    }
  });

  const updatePayload = {
    total_allocated: totals.total_allocated,
    alloc_needs_me: totals.alloc_needs_me,
    alloc_needs_partner: totals.alloc_needs_partner,
    alloc_needs_joint: totals.alloc_needs_joint,
    alloc_wants_me: totals.alloc_wants_me,
    alloc_wants_partner: totals.alloc_wants_partner,
    alloc_wants_joint: totals.alloc_wants_joint,
    alloc_savings_me: totals.alloc_savings_me,
    alloc_savings_partner: totals.alloc_savings_partner,
    alloc_savings_joint: totals.alloc_savings_joint,
    alloc_repay_me: totals.alloc_repay_me,
    alloc_repay_partner: totals.alloc_repay_partner,
    alloc_repay_joint: totals.alloc_repay_joint,
    ...remTotals,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('paycycles') as any).update(updatePayload).eq('id', paycycleId);
}


export async function createSeed(
  data: CreateSeedInput,
  client?: SupabaseClient<Database>
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());

    if (data.due_date) {
      const { data: paycycle } = (await supabase
        .from('paycycles')
        .select('start_date, end_date')
        .eq('id', data.paycycle_id)
        .single()) as { data: { start_date: string; end_date: string } | null };
      if (paycycle) {
        const result = validateDueDateInCycle(
          data.due_date,
          paycycle.start_date,
          paycycle.end_date
        );
        if (!result.valid) return { error: result.message };
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
    const canActAsPartner = isPartner && partnerHouseholdId && partnerHouseholdId === data.household_id;
    if (!user && !canActAsPartner) return { error: 'Not authenticated' };

    let linkedPotId = data.linked_pot_id ?? null;
    let linkedRepaymentId = data.linked_repayment_id ?? null;

    if (data.type === 'savings' && data.pot && !linkedPotId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pot, error: potErr } = await (supabase.from('pots') as any)
        .insert({
          household_id: data.household_id,
          name: data.name,
          current_amount: data.pot.current_amount,
          target_amount: data.pot.target_amount,
          target_date: data.pot.target_date,
          status: data.pot.status,
        })
        .select('id')
        .single();
      if (potErr) return { error: potErr.message };
      linkedPotId = pot?.id ?? null;
    }

    if (data.type === 'repay' && data.repayment && !linkedRepaymentId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: repayment, error: repayErr } = await (supabase.from('repayments') as any)
        .insert({
          household_id: data.household_id,
          name: data.name,
          starting_balance: data.repayment.starting_balance,
          current_balance: data.repayment.current_balance,
          target_date: data.repayment.target_date,
          status: data.repayment.status,
          interest_rate: data.repayment.interest_rate ?? null,
        })
        .select('id')
        .single();
      if (repayErr) return { error: repayErr.message };
      linkedRepaymentId = repayment?.id ?? null;
    }

    const { data: household } = (await supabase
      .from('households')
      .select('joint_ratio')
      .eq('id', data.household_id)
      .single()) as { data: { joint_ratio: number } | null };

    const jointRatio = household?.joint_ratio ?? 0.5;
    const { amount_me, amount_partner } = calculateSeedSplit(
      data.amount,
      data.payment_source,
      data.split_ratio,
      jointRatio
    );

    /** true when the creator is the household owner; false when the partner created the seed */
    const createdByOwner = !isPartner;

    const insertData: SeedInsert = {
      household_id: data.household_id,
      paycycle_id: data.paycycle_id,
      name: data.name,
      amount: data.amount,
      type: data.type,
      payment_source: data.payment_source,
      split_ratio: data.split_ratio ?? null,
      is_recurring: data.is_recurring ?? false,
      due_date: data.due_date ?? null,
      is_paid: false,
      is_paid_me: false,
      is_paid_partner: false,
      amount_me,
      amount_partner,
      linked_pot_id: linkedPotId,
      linked_repayment_id: linkedRepaymentId,
      uses_joint_account: data.uses_joint_account ?? false,
      created_by_owner: createdByOwner,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (supabase.from('seeds') as any)
      .insert(insertData)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!inserted) return { error: 'Seed create did not persist. Please try again.' };

    await updatePaycycleAllocations(data.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    revalidatePath('/dashboard');
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}

export async function updateSeed(
  seedId: string,
  data: UpdateSeedInput,
  client?: SupabaseClient<Database>
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());

    const { data: seed } = (await supabase
      .from('seeds')
      .select('household_id, paycycle_id, amount, payment_source, split_ratio, linked_pot_id, linked_repayment_id, type, name')
      .eq('id', seedId)
      .single()) as {
      data: {
        household_id: string;
        paycycle_id: string;
        amount: number;
        payment_source: PaymentSource;
        split_ratio: number | null;
        linked_pot_id: string | null;
        linked_repayment_id: string | null;
        type: string;
        name: string;
      } | null;
    };

    if (!seed) return { error: 'Seed not found' };

    if (data.due_date !== undefined) {
      const { data: paycycle } = (await supabase
        .from('paycycles')
        .select('start_date, end_date')
        .eq('id', seed.paycycle_id)
        .single()) as { data: { start_date: string; end_date: string } | null };
      if (paycycle) {
        const result = validateDueDateInCycle(
          data.due_date,
          paycycle.start_date,
          paycycle.end_date
        );
        if (!result.valid) return { error: result.message };
      }
    }

    let linkedPotId: string | null = seed.linked_pot_id;
    let linkedRepaymentId: string | null = seed.linked_repayment_id;

    // User added optional pot details on edit (seed had no linked pot at creation).
    if (seed.type === 'savings' && data.pot && !seed.linked_pot_id) {
      const currentAmount = data.pot.current_amount ?? seed.amount ?? 0;
      const targetAmount = data.pot.target_amount ?? seed.amount ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newPot, error: potErr } = await (supabase.from('pots') as any)
        .insert({
          household_id: seed.household_id,
          name: data.name ?? seed.name,
          current_amount: currentAmount,
          target_amount: targetAmount,
          target_date: data.pot.target_date ?? null,
          status: data.pot.status ?? 'active',
        })
        .select('id')
        .single();
      if (potErr) return { error: potErr.message };
      if (!newPot) return { error: 'Pot create did not persist. Please try again.' };
      linkedPotId = (newPot as { id: string }).id;
    }

    // User added optional repayment details on edit (seed had no linked repayment at creation).
    if (seed.type === 'repay' && data.repayment && !seed.linked_repayment_id) {
      const startingBalance = data.repayment.starting_balance ?? data.repayment.current_balance ?? seed.amount ?? 0;
      const currentBalance = data.repayment.current_balance ?? data.repayment.starting_balance ?? seed.amount ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newRepayment, error: repayErr } = await (supabase.from('repayments') as any)
        .insert({
          household_id: seed.household_id,
          name: data.name ?? seed.name,
          starting_balance: startingBalance,
          current_balance: currentBalance,
          target_date: data.repayment.target_date ?? null,
          status: data.repayment.status ?? 'active',
          interest_rate: data.repayment.interest_rate ?? null,
        })
        .select('id')
        .single();
      if (repayErr) return { error: repayErr.message };
      if (!newRepayment) return { error: 'Repayment create did not persist. Please try again.' };
      linkedRepaymentId = (newRepayment as { id: string }).id;
    }

    if (data.pot && linkedPotId) {
      const potUpdate: Record<string, unknown> = {};
      if (data.pot.current_amount !== undefined) potUpdate.current_amount = data.pot.current_amount;
      if (data.pot.target_amount !== undefined) potUpdate.target_amount = data.pot.target_amount;
      if (data.pot.target_date !== undefined) potUpdate.target_date = data.pot.target_date;
      if (data.pot.status !== undefined) potUpdate.status = data.pot.status;
      if (Object.keys(potUpdate).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: potUpdated, error: potError } = await (supabase.from('pots') as any)
          .update(potUpdate)
          .eq('id', linkedPotId)
          .select('id')
          .single();
        if (potError) return { error: potError.message };
        if (!potUpdated) return { error: 'Pot update did not persist. Please try again.' };
      }
    }

    if (data.repayment && linkedRepaymentId) {
      const repayUpdate: Record<string, unknown> = {};
      if (data.repayment.current_balance !== undefined) repayUpdate.current_balance = data.repayment.current_balance;
      if (data.repayment.target_date !== undefined) repayUpdate.target_date = data.repayment.target_date;
      if (data.repayment.status !== undefined) repayUpdate.status = data.repayment.status;
      if (data.repayment.interest_rate !== undefined) repayUpdate.interest_rate = data.repayment.interest_rate;
      if (Object.keys(repayUpdate).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: repayUpdated, error: repayError } = await (supabase.from('repayments') as any)
          .update(repayUpdate)
          .eq('id', linkedRepaymentId)
          .select('id')
          .single();
        if (repayError) return { error: repayError.message };
        if (!repayUpdated) return { error: 'Repayment update did not persist. Please try again.' };
      }
    }

    const { data: household } = (await supabase
      .from('households')
      .select('joint_ratio')
      .eq('id', seed.household_id)
      .single()) as { data: { joint_ratio: number } | null };

    const jointRatio = household?.joint_ratio ?? 0.5;
    const amount = data.amount ?? seed.amount;
    const paymentSource = data.payment_source ?? seed.payment_source;
    const splitRatio = data.split_ratio !== undefined ? data.split_ratio : seed.split_ratio;

    const { amount_me, amount_partner } = calculateSeedSplit(
      amount,
      paymentSource,
      splitRatio,
      jointRatio
    );

    const seedUpdate: Record<string, unknown> = {
      amount_me,
      amount_partner,
    };
    if (data.name !== undefined) seedUpdate.name = data.name;
    if (data.amount !== undefined) seedUpdate.amount = data.amount;
    if (data.payment_source !== undefined) seedUpdate.payment_source = data.payment_source;
    if (data.split_ratio !== undefined) seedUpdate.split_ratio = data.split_ratio;
    if (data.is_recurring !== undefined) seedUpdate.is_recurring = data.is_recurring;
    if (data.due_date !== undefined) seedUpdate.due_date = data.due_date;
    if (data.linked_pot_id !== undefined) seedUpdate.linked_pot_id = data.linked_pot_id;
    if (data.linked_repayment_id !== undefined) seedUpdate.linked_repayment_id = data.linked_repayment_id;
    if (linkedPotId !== seed.linked_pot_id) seedUpdate.linked_pot_id = linkedPotId;
    if (linkedRepaymentId !== seed.linked_repayment_id) seedUpdate.linked_repayment_id = linkedRepaymentId;
    if (data.uses_joint_account !== undefined) seedUpdate.uses_joint_account = data.uses_joint_account;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seedUpdated, error } = await (supabase.from('seeds') as any)
      .update(seedUpdate)
      .eq('id', seedId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!seedUpdated) return { error: 'Seed update did not persist. Please try again.' };

    await updatePaycycleAllocations(seed.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    revalidatePath('/dashboard');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update seed' };
  }
}

export async function deleteSeed(
  seedId: string,
  client?: SupabaseClient<Database>
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());

    const { data: seed } = (await supabase
      .from('seeds')
      .select('paycycle_id')
      .eq('id', seedId)
      .single()) as { data: { paycycle_id: string } | null };

    if (!seed) return { error: 'Seed not found' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: deleted, error } = await (supabase.from('seeds') as any)
      .delete()
      .eq('id', seedId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!deleted) return { error: 'Seed delete did not persist. Please try again.' };

    await updatePaycycleAllocations(seed.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    revalidatePath('/dashboard');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete seed' };
  }
}

/** Options for markOverdueSeedsPaid. Use skipRevalidate: true when calling during RSC render to avoid "revalidatePath during render" error. */
export type MarkOverdueSeedsPaidOptions = { skipRevalidate?: boolean };

/** Mark seeds (need, want, savings, repay) with due_date in the past as paid. Call when loading blueprint/dashboard for active cycle. Returns count of seeds marked. */
export async function markOverdueSeedsPaid(
  paycycleId: string,
  client?: SupabaseClient<Database>,
  options?: MarkOverdueSeedsPaidOptions
): Promise<number> {
  const supabase = client ?? (await createServerSupabaseClient());
  const today = new Date().toISOString().slice(0, 10);

  const { data: overdue } = await supabase
    .from('seeds')
    .select('*')
    .eq('paycycle_id', paycycleId)
    .in('type', ['need', 'want', 'savings', 'repay'])
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .eq('is_paid', false);

  if (!overdue || overdue.length === 0) return 0;

  const { updateLinkedPotOrRepayment } = await import('@/lib/actions/ritual-actions');

  for (const row of overdue as SeedRow[]) {
    const linkedResult = await updateLinkedPotOrRepayment(row, 'both', true, supabase);
    if (linkedResult.error) continue; // Skip this seed so we don't leave seed paid but pot/repayment not updated
    const isJoint = row.payment_source === 'joint';
    const updates: Record<string, unknown> = {
      is_paid: true,
      is_paid_me: isJoint || row.payment_source === 'me',
      is_paid_partner: isJoint || row.payment_source === 'partner',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated } = await (supabase.from('seeds') as any)
      .update(updates)
      .eq('id', row.id)
      .select('id')
      .single();
    if (!updated) continue; // Skip revalidate if this seed update didn't persist
  }

  await updatePaycycleAllocations(paycycleId);
  if (!options?.skipRevalidate) {
    revalidatePath('/dashboard/blueprint');
    revalidatePath('/dashboard');
  }
  return overdue.length;
}

/** Create next paycycle (as draft), clone recurring seeds, and return new cycle id */
export async function createNextPaycycle(
  currentPaycycleId: string
): Promise<{ cycleId?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { createNextPaycycleCore } = await import(
      '@/lib/paycycle/create-next-paycycle-core'
    );
    const result = await createNextPaycycleCore(supabase, currentPaycycleId, {
      status: 'draft',
    });
    if (result.cycleId) {
      revalidatePath('/dashboard/blueprint');
    }
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create next paycycle' };
  }
}

/**
 * Resync draft cycle from active: update/add recurring seeds from active into draft.
 * Use when user changed recurring bills in the active cycle and wants draft to reflect that.
 */
export async function resyncDraftFromActive(
  draftPaycycleId: string,
  activePaycycleId: string
): Promise<{ error?: string }> {
  const { resyncDraftFromActiveCore } = await import('@/lib/paycycle/resync-draft-core');
  const supabase = await createServerSupabaseClient();
  const result = await resyncDraftFromActiveCore(supabase, draftPaycycleId, activePaycycleId);
  if (!result.error) revalidatePath('/dashboard/blueprint');
  return result;
}
