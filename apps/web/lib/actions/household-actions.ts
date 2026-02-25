// @ts-nocheck
'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type HouseholdUpdate = Database['public']['Tables']['households']['Update'];

export interface UpdatePercentagesInput {
  needs_percent: number;
  wants_percent: number;
  savings_percent: number;
  repay_percent: number;
}

export async function updateHouseholdPercentages(
  householdId: string,
  data: UpdatePercentagesInput,
  client?: SupabaseClient
): Promise<{ error?: string }> {
  const total =
    data.needs_percent + data.wants_percent + data.savings_percent + data.repay_percent;
  if (Math.abs(total - 100) > 0.01) {
    return { error: 'Percentages must total 100%' };
  }

  try {
    const supabase = client ?? (await createServerSupabaseClient());

    const update: HouseholdUpdate = {
      needs_percent: data.needs_percent,
      wants_percent: data.wants_percent,
      savings_percent: data.savings_percent,
      repay_percent: data.repay_percent,
    };
    const { data: updated, error } = await supabase
      .from('households')
      .update(update)
      .eq('id', householdId)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!updated) return { error: 'Percentages update did not persist. Please try again.' };

    if (!client) revalidatePath('/dashboard/money/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update percentages' };
  }
}

/**
 * Returns founding_member_until for the current user's household, or null if not a founding member.
 * Safe to call from client components via server action — auth is enforced server-side.
 */
export async function getMyFoundingMemberStatus(): Promise<{ foundingMemberUntil: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { foundingMemberUntil: null };

    const { data: ownedData } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: partnerOfData } = await supabase
      .from('households')
      .select('id')
      .eq('partner_user_id', user.id)
      .order('partner_accepted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const householdId =
      (ownedData as { id: string } | null)?.id ??
      (partnerOfData as { id: string } | null)?.id ??
      null;
    if (!householdId) return { foundingMemberUntil: null };

    const { data: householdStatus } = await supabase
      .from('households')
      .select('founding_member_until')
      .eq('id', householdId)
      .maybeSingle();
    const until = (householdStatus as Record<string, unknown> | null)?.founding_member_until as string | null ?? null;
    return { foundingMemberUntil: until };
  } catch {
    return { foundingMemberUntil: null };
  }
}
