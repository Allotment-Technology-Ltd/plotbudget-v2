'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateNextCycleDates } from '@/lib/utils/pay-cycle-dates';
import type { Database } from '@/lib/supabase/database.types';

type Household = Database['public']['Tables']['households']['Row'];
type SeedRow = Database['public']['Tables']['seeds']['Row'];
type SeedInsert = Database['public']['Tables']['seeds']['Insert'];
type PaycycleInsert = Database['public']['Tables']['paycycles']['Insert'];

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
  };
}

export interface UpdateSeedInput {
  name?: string;
  amount?: number;
  payment_source?: PaymentSource;
  split_ratio?: number | null;
  uses_joint_account?: boolean;
  is_recurring?: boolean;
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
async function updatePaycycleAllocations(paycycleId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

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

export async function createSeed(data: CreateSeedInput): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

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

    const insertData: SeedInsert = {
      household_id: data.household_id,
      paycycle_id: data.paycycle_id,
      name: data.name,
      amount: data.amount,
      type: data.type,
      payment_source: data.payment_source,
      split_ratio: data.split_ratio ?? null,
      is_recurring: data.is_recurring ?? false,
      is_paid: false,
      is_paid_me: false,
      is_paid_partner: false,
      amount_me,
      amount_partner,
      linked_pot_id: linkedPotId,
      linked_repayment_id: linkedRepaymentId,
      uses_joint_account: data.uses_joint_account ?? false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('seeds') as any).insert(insertData);

    if (error) return { error: error.message };

    await updatePaycycleAllocations(data.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message };
  }
}

export async function updateSeed(
  seedId: string,
  data: UpdateSeedInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: seed } = (await supabase
      .from('seeds')
      .select('household_id, paycycle_id, amount, payment_source, split_ratio, linked_pot_id, linked_repayment_id')
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
      } | null;
    };

    if (!seed) return { error: 'Seed not found' };

    if (data.pot && seed.linked_pot_id) {
      const potUpdate: Record<string, unknown> = {};
      if (data.pot.current_amount !== undefined) potUpdate.current_amount = data.pot.current_amount;
      if (data.pot.target_amount !== undefined) potUpdate.target_amount = data.pot.target_amount;
      if (data.pot.target_date !== undefined) potUpdate.target_date = data.pot.target_date;
      if (data.pot.status !== undefined) potUpdate.status = data.pot.status;
      if (Object.keys(potUpdate).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('pots') as any).update(potUpdate).eq('id', seed.linked_pot_id);
      }
    }

    if (data.repayment && seed.linked_repayment_id) {
      const repayUpdate: Record<string, unknown> = {};
      if (data.repayment.current_balance !== undefined) repayUpdate.current_balance = data.repayment.current_balance;
      if (data.repayment.target_date !== undefined) repayUpdate.target_date = data.repayment.target_date;
      if (data.repayment.status !== undefined) repayUpdate.status = data.repayment.status;
      if (Object.keys(repayUpdate).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('repayments') as any).update(repayUpdate).eq('id', seed.linked_repayment_id);
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
    if (data.linked_pot_id !== undefined) seedUpdate.linked_pot_id = data.linked_pot_id;
    if (data.linked_repayment_id !== undefined) seedUpdate.linked_repayment_id = data.linked_repayment_id;
    if (data.uses_joint_account !== undefined) seedUpdate.uses_joint_account = data.uses_joint_account;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('seeds') as any)
      .update(seedUpdate)
      .eq('id', seedId);

    if (error) return { error: error.message };

    await updatePaycycleAllocations(seed.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update seed' };
  }
}

export async function deleteSeed(seedId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: seed } = (await supabase
      .from('seeds')
      .select('paycycle_id')
      .eq('id', seedId)
      .single()) as { data: { paycycle_id: string } | null };

    if (!seed) return { error: 'Seed not found' };

    const { error } = await supabase.from('seeds').delete().eq('id', seedId);

    if (error) return { error: error.message };

    await updatePaycycleAllocations(seed.paycycle_id);
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete seed' };
  }
}

/** Create next paycycle, clone recurring seeds, and return new cycle id */
export async function createNextPaycycle(
  currentPaycycleId: string
): Promise<{ cycleId?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: current } = (await supabase
      .from('paycycles')
      .select('*, households(*)')
      .eq('id', currentPaycycleId)
      .single()) as {
      data: {
        household_id: string;
        end_date: string;
        total_income: number;
        snapshot_user_income: number;
        snapshot_partner_income: number;
        households: Household;
      } | null;
    };

    if (!current) return { error: 'Paycycle not found' };

    const household = current.households;
    const { start: startStr, end: endStr } = calculateNextCycleDates(
      current.end_date,
      household.pay_cycle_type,
      household.pay_day ?? undefined
    );
    const cycleName = `Paycycle ${startStr}`;

    const paycycleInsert: PaycycleInsert = {
      household_id: current.household_id,
      status: 'draft',
      name: cycleName,
      start_date: startStr,
      end_date: endStr,
      total_income: current.total_income,
      snapshot_user_income: current.snapshot_user_income,
      snapshot_partner_income: current.snapshot_partner_income,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCycle, error: insertErr } = await (supabase.from('paycycles') as any)
      .insert(paycycleInsert)
      .select()
      .single();

    if (insertErr || !newCycle) return { error: insertErr?.message ?? 'Failed to create paycycle' };

    const { data: recurringSeedsData } = await supabase
      .from('seeds')
      .select('*')
      .eq('paycycle_id', currentPaycycleId)
      .eq('is_recurring', true);

    const recurringSeeds = (recurringSeedsData ?? []) as SeedRow[];

    if (recurringSeeds.length > 0) {
      const inserts: SeedInsert[] = recurringSeeds.map((s) => ({
        household_id: s.household_id,
        paycycle_id: newCycle.id,
        name: s.name,
        amount: s.amount,
        type: s.type,
        category: s.category,
        payment_source: s.payment_source,
        is_recurring: true,
        is_paid: false,
        is_paid_me: false,
        is_paid_partner: false,
        amount_me: s.amount_me,
        amount_partner: s.amount_partner,
        split_ratio: s.split_ratio,
        linked_pot_id: s.linked_pot_id ?? null,
        linked_repayment_id: s.linked_repayment_id ?? null,
        uses_joint_account: s.uses_joint_account ?? false,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('seeds') as any).insert(inserts);
      await updatePaycycleAllocations(newCycle.id);
    }

    revalidatePath('/dashboard/blueprint');
    return { cycleId: newCycle.id };
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
  try {
    const supabase = await createServerSupabaseClient();

    const { data: draftCycle } = (await supabase
      .from('paycycles')
      .select('id, status, household_id')
      .eq('id', draftPaycycleId)
      .single()) as { data: { id: string; status: string; household_id: string } | null };

    if (!draftCycle || draftCycle.status !== 'draft') {
      return { error: 'Draft paycycle not found or not a draft' };
    }

    const { data: activeRecurring } = await supabase
      .from('seeds')
      .select('*')
      .eq('paycycle_id', activePaycycleId)
      .eq('is_recurring', true);

    const recurringSeeds = (activeRecurring ?? []) as SeedRow[];

    const { data: draftSeedsData } = await supabase
      .from('seeds')
      .select('id, name, type')
      .eq('paycycle_id', draftPaycycleId);

    const draftSeeds = (draftSeedsData ?? []) as { id: string; name: string; type: string }[];
    const draftByKey = new Map(draftSeeds.map((s) => [`${s.name}::${s.type}`, s]));

    const { data: household } = (await supabase
      .from('households')
      .select('joint_ratio')
      .eq('id', draftCycle.household_id)
      .single()) as { data: { joint_ratio: number } | null };
    const jointRatio = household?.joint_ratio ?? 0.5;

    for (const seed of recurringSeeds) {
      const key = `${seed.name}::${seed.type}`;
      const existing = draftByKey.get(key);

      const { amount_me, amount_partner } = calculateSeedSplit(
        seed.amount,
        seed.payment_source,
        seed.split_ratio,
        jointRatio
      );

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('seeds') as any)
          .update({
            amount: seed.amount,
            payment_source: seed.payment_source,
            split_ratio: seed.split_ratio,
            amount_me,
            amount_partner,
            linked_pot_id: seed.linked_pot_id ?? null,
            linked_repayment_id: seed.linked_repayment_id ?? null,
            uses_joint_account: seed.uses_joint_account ?? false,
          })
          .eq('id', existing.id);
      } else {
        const insertData: SeedInsert = {
          household_id: seed.household_id,
          paycycle_id: draftPaycycleId,
          name: seed.name,
          amount: seed.amount,
          type: seed.type,
          category: seed.category,
          payment_source: seed.payment_source,
          split_ratio: seed.split_ratio,
          is_recurring: true,
          is_paid: false,
          is_paid_me: false,
          is_paid_partner: false,
          amount_me,
          amount_partner,
          linked_pot_id: seed.linked_pot_id ?? null,
          linked_repayment_id: seed.linked_repayment_id ?? null,
          uses_joint_account: seed.uses_joint_account ?? false,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('seeds') as any).insert(insertData);
      }
    }

    await updatePaycycleAllocations(draftPaycycleId);
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to resync draft' };
  }
}
