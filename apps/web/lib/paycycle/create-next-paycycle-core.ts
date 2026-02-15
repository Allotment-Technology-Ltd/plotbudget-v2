/**
 * Shared core logic for creating the next paycycle with recurring seeds cloned.
 * Used by both the blueprint "Create Next Cycle" flow and the dev cycle switchover simulation.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { calculateNextCycleDates } from '@/lib/utils/pay-cycle-dates';
import { projectIncomeForCycle } from '@/lib/utils/income-projection';
import { rollDueDateToCycle } from '@/lib/utils/seed-utils';
import { updatePaycycleAllocations } from '@/lib/actions/seed-actions';

type Household = Database['public']['Tables']['households']['Row'];
type SeedRow = Database['public']['Tables']['seeds']['Row'];
type SeedInsert = Database['public']['Tables']['seeds']['Insert'];
type PaycycleInsert = Database['public']['Tables']['paycycles']['Insert'];

export interface CreateNextPaycycleOptions {
  /** New cycle status. Default: 'draft' (blueprint flow). Use 'active' for switchover simulation. */
  status?: 'draft' | 'active';
}

/**
 * Create the next paycycle from the current one, clone recurring seeds, and return the new cycle id.
 * Caller must pass a Supabase client (server or admin).
 */
export async function createNextPaycycleCore(
  supabase: SupabaseClient<Database>,
  currentPaycycleId: string,
  options: CreateNextPaycycleOptions = {}
): Promise<{ cycleId?: string; error?: string }> {
  const { status = 'draft' } = options;

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

  let total_income = current.total_income;
  let snapshot_user_income = current.snapshot_user_income;
  let snapshot_partner_income = current.snapshot_partner_income;

  const { data: incomeSources } = await supabase
    .from('income_sources')
    .select('id, amount, frequency_rule, day_of_month, anchor_date, payment_source')
    .eq('household_id', current.household_id)
    .eq('is_active', true);

  if (incomeSources && incomeSources.length > 0) {
    const projected = projectIncomeForCycle(
      startStr,
      endStr,
      incomeSources as {
        id: string;
        amount: number;
        frequency_rule: 'specific_date' | 'last_working_day' | 'every_4_weeks';
        day_of_month: number | null;
        anchor_date: string | null;
        payment_source: 'me' | 'partner' | 'joint';
      }[],
      household.joint_ratio ?? 0.5
    );
    total_income = projected.total;
    snapshot_user_income = projected.snapshot_user_income;
    snapshot_partner_income = projected.snapshot_partner_income;
  }

  const paycycleInsert: PaycycleInsert = {
    household_id: current.household_id,
    status,
    name: cycleName,
    start_date: startStr,
    end_date: endStr,
    total_income,
    snapshot_user_income,
    snapshot_partner_income,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newCycle, error: insertErr } = await (supabase.from('paycycles') as any)
    .insert(paycycleInsert)
    .select()
    .single();

  if (insertErr || !newCycle) {
    return { error: (insertErr as { message?: string })?.message ?? 'Failed to create paycycle' };
  }

  const newCycleRow = newCycle as { id: string };

  const { data: recurringSeedsData } = await supabase
    .from('seeds')
    .select('*')
    .eq('paycycle_id', currentPaycycleId)
    .eq('is_recurring', true);

  const recurringSeeds = (recurringSeedsData ?? []) as SeedRow[];

  if (recurringSeeds.length > 0) {
    const inserts: SeedInsert[] = recurringSeeds.map((s) => ({
      household_id: s.household_id,
      paycycle_id: newCycleRow.id,
      name: s.name,
      amount: s.amount,
      type: s.type,
      category: s.category,
      payment_source: s.payment_source,
      is_recurring: true,
      due_date: rollDueDateToCycle(s.due_date ?? null, startStr, endStr),
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
    await updatePaycycleAllocations(newCycleRow.id, supabase);
  }

  return { cycleId: newCycleRow.id };
}
