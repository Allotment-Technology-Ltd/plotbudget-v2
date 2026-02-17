'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateSeed, createSeed } from '@/lib/actions/seed-actions';
import type { CreateSeedInput } from '@/lib/actions/seed-actions';

type PaymentSource = 'me' | 'partner' | 'joint';

type LockInParams = {
  potId: string | null;
  repaymentId: string | null;
  amount: number;
  name: string;
  type: 'savings' | 'repay';
};

function validateLockInInput(params: LockInParams): string | null {
  const { potId, repaymentId, amount, type } = params;
  if (amount <= 0) return 'Amount must be positive';
  if (!potId && !repaymentId) return 'Must specify pot or repayment';
  if ((type === 'savings' && !potId) || (type === 'repay' && !repaymentId)) {
    return 'Pot required for savings, repayment required for repay';
  }
  return null;
}

async function getHouseholdIdForUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', userId)
    .single()) as { data: { household_id: string | null } | null };
  return profile?.household_id ?? null;
}

async function findPaycycleForHousehold(
  supabase: SupabaseClient<Database>,
  householdId: string
): Promise<string | null> {
  const { data: activeCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  if (activeCycle?.id) return activeCycle.id;

  const { data: draftCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  return draftCycle?.id ?? null;
}

async function findExistingRecurringSeed(
  supabase: SupabaseClient<Database>,
  paycycleId: string,
  potId: string | null,
  repaymentId: string | null,
  type: 'savings' | 'repay'
): Promise<{ id: string; payment_source: PaymentSource; split_ratio: number | null } | null> {
  let query = supabase
    .from('seeds')
    .select('id, payment_source, split_ratio')
    .eq('paycycle_id', paycycleId)
    .eq('is_recurring', true)
    .eq('type', type);

  if (potId) query = query.eq('linked_pot_id', potId);
  else if (repaymentId) query = query.eq('linked_repayment_id', repaymentId);

  const { data } = (await query.maybeSingle()) as {
    data: { id: string; payment_source: PaymentSource; split_ratio: number | null } | null;
  };
  return data;
}

async function updateOrCreateLockInSeed(
  supabase: SupabaseClient<Database>,
  params: LockInParams & { paycycleId: string; householdId: string },
  existingSeed: { id: string; payment_source: PaymentSource; split_ratio: number | null } | null
): Promise<string | null> {
  const { potId, repaymentId, amount, name, type, paycycleId, householdId } = params;

  if (existingSeed) {
    const result = await updateSeed(existingSeed.id, {
      amount,
      payment_source: existingSeed.payment_source,
      split_ratio: existingSeed.split_ratio,
    });
    return result.error ?? null;
  }

  const { data: household } = (await supabase
    .from('households')
    .select('joint_ratio')
    .eq('id', householdId)
    .single()) as { data: { joint_ratio: number } | null };

  const createInput: CreateSeedInput = {
    name,
    amount,
    type,
    payment_source: 'joint',
    is_recurring: true,
    paycycle_id: paycycleId,
    household_id: householdId,
  };
  if (potId) createInput.linked_pot_id = potId;
  if (repaymentId) createInput.linked_repayment_id = repaymentId;
  if (household?.joint_ratio != null) createInput.split_ratio = household.joint_ratio;

  const result = await createSeed(createInput);
  return result.error ?? null;
}

function revalidateForecastPaths(potId: string | null, repaymentId: string | null): void {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/blueprint');
  if (potId) revalidatePath(`/dashboard/forecast/pot/${potId}`);
  if (repaymentId) revalidatePath(`/dashboard/forecast/repayment/${repaymentId}`);
}

/**
 * Lock in an amount for a pot (savings) or repayment (debt).
 * Finds or creates the recurring seed in the active or draft cycle linked to the pot/repayment.
 * Pass optional supabase client for API routes (e.g. token-based auth from native).
 */
export async function lockInForecastAmount(
  potId: string | null,
  repaymentId: string | null,
  amount: number,
  name: string,
  type: 'savings' | 'repay',
  supabaseClient?: SupabaseClient<Database>
): Promise<{ success?: boolean; error?: string }> {
  const params: LockInParams = { potId, repaymentId, amount, name, type };

  const validationError = validateLockInInput(params);
  if (validationError) return { error: validationError };

  const supabase = supabaseClient ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return { error: 'No household' };

  const paycycleId = await findPaycycleForHousehold(supabase, householdId);
  if (!paycycleId) return { error: 'No active or draft pay cycle' };

  const existingSeed = await findExistingRecurringSeed(
    supabase,
    paycycleId,
    potId,
    repaymentId,
    type
  );

  const seedError = await updateOrCreateLockInSeed(
    supabase,
    { ...params, paycycleId, householdId },
    existingSeed
  );
  if (seedError) return { error: seedError };

  revalidateForecastPaths(potId, repaymentId);
  return { success: true };
}
