'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateSeed, createSeed } from '@/lib/actions/seed-actions';
import type { CreateSeedInput } from '@/lib/actions/seed-actions';

type PaymentSource = 'me' | 'partner' | 'joint';

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
  if (amount <= 0) return { error: 'Amount must be positive' };
  if (!potId && !repaymentId) return { error: 'Must specify pot or repayment' };
  if ((type === 'savings' && !potId) || (type === 'repay' && !repaymentId)) {
    return { error: 'Pot required for savings, repayment required for repay' };
  }

  const supabase = supabaseClient ?? (await createServerSupabaseClient());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()) as { data: { household_id: string | null } | null };

  const householdId = profile?.household_id;
  if (!householdId) return { error: 'No household' };

  // Prefer active, else draft
  const { data: activeCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  const { data: draftCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  const paycycleId = activeCycle?.id ?? draftCycle?.id;
  if (!paycycleId) return { error: 'No active or draft pay cycle' };

  // Find existing recurring seed linked to this pot/repayment in this cycle
  let query = supabase
    .from('seeds')
    .select('id, payment_source, split_ratio')
    .eq('paycycle_id', paycycleId)
    .eq('is_recurring', true)
    .eq('type', type);

  if (potId) query = query.eq('linked_pot_id', potId);
  else if (repaymentId) query = query.eq('linked_repayment_id', repaymentId);

  const { data: existingSeed } = (await query.maybeSingle()) as {
    data: { id: string; payment_source: PaymentSource; split_ratio: number | null } | null;
  };

  if (existingSeed) {
    const result = await updateSeed(existingSeed.id, {
      amount,
      payment_source: existingSeed.payment_source,
      split_ratio: existingSeed.split_ratio,
    });
    if (result.error) return { error: result.error };
  } else {
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
    if (result.error) return { error: result.error };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/blueprint');
  if (potId) revalidatePath(`/dashboard/forecast/pot/${potId}`);
  if (repaymentId) revalidatePath(`/dashboard/forecast/repayment/${repaymentId}`);
  return { success: true };
}
