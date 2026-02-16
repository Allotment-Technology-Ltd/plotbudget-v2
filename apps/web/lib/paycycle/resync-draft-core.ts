/**
 * Resync draft cycle from active: update/add recurring seeds from active into draft.
 * Shared by server action and API route (token-based client).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { rollDueDateToCycle } from '@/lib/utils/seed-utils';
import { updatePaycycleAllocations } from '@/lib/actions/seed-actions';

type SeedRow = Database['public']['Tables']['seeds']['Row'];
type SeedInsert = Database['public']['Tables']['seeds']['Insert'];
type PaymentSource = 'me' | 'partner' | 'joint';

function calculateSeedSplit(
  totalAmount: number,
  paymentSource: PaymentSource,
  seedSplitRatio: number | null | undefined,
  householdJointRatio: number
): { amount_me: number; amount_partner: number } {
  if (paymentSource === 'me') return { amount_me: totalAmount, amount_partner: 0 };
  if (paymentSource === 'partner') return { amount_me: 0, amount_partner: totalAmount };
  const effectiveRatio = seedSplitRatio ?? householdJointRatio ?? 0.5;
  return { amount_me: totalAmount * effectiveRatio, amount_partner: totalAmount - totalAmount * effectiveRatio };
}

/**
 * Caller must be validated by the route (owner or partner of the draft cycle's household) before calling.
 */
export async function resyncDraftFromActiveCore(
  supabase: SupabaseClient<Database>,
  draftPaycycleId: string,
  activePaycycleId: string
): Promise<{ error?: string }> {
  try {
    const { data: draftCycle } = (await supabase
      .from('paycycles')
      .select('id, status, household_id, start_date, end_date')
      .eq('id', draftPaycycleId)
      .single()) as {
      data: { id: string; status: string; household_id: string; start_date: string; end_date: string } | null;
    };

    if (!draftCycle || draftCycle.status !== 'draft') {
      return { error: 'Draft paycycle not found or not a draft' };
    }
    const draftStart = draftCycle.start_date;
    const draftEnd = draftCycle.end_date;

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
        seed.payment_source as PaymentSource,
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
            due_date: rollDueDateToCycle(seed.due_date ?? null, draftStart, draftEnd),
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
          due_date: rollDueDateToCycle(seed.due_date ?? null, draftStart, draftEnd),
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

    await updatePaycycleAllocations(draftPaycycleId, supabase);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to resync draft' };
  }
}
