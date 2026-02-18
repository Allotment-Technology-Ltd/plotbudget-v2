'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UpdatePercentagesInput {
  needs_percent: number;
  wants_percent: number;
  savings_percent: number;
  repay_percent: number;
}

export async function updateHouseholdPercentages(
  householdId: string,
  data: UpdatePercentagesInput,
  client?: SupabaseClient<Database>
): Promise<{ error?: string }> {
  const total =
    data.needs_percent + data.wants_percent + data.savings_percent + data.repay_percent;
  if (Math.abs(total - 100) > 0.01) {
    return { error: 'Percentages must total 100%' };
  }

  try {
    const supabase = client ?? (await createServerSupabaseClient());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase.from('households') as any)
      .update({
        needs_percent: data.needs_percent,
        wants_percent: data.wants_percent,
        savings_percent: data.savings_percent,
        repay_percent: data.repay_percent,
      })
      .eq('id', householdId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!updated) return { error: 'Percentages update did not persist. Please try again.' };

    if (!client) revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update percentages' };
  }
}
