/**
 * Blueprint data fetching for native app.
 * Mirrors web blueprint page queries so data matches for same user.
 * Fetches seeds (by paycycle), pots, repayments for add/edit/delete.
 */

import { createSupabaseClient } from './supabase';
import type { Household, PayCycle, Pot, Repayment, Seed } from '@repo/supabase';

export interface BlueprintData {
  household: Household | null;
  paycycle: PayCycle | null;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
}

export async function fetchBlueprintData(): Promise<BlueprintData> {
  if (process.env.EXPO_PUBLIC_SIMULATE_NETWORK_FAILURE === 'true') {
    await new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Simulated network failure')), 500)
    );
  }

  const supabase = createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { household: null, paycycle: null, seeds: [], pots: [], repayments: [] };
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id')
    .eq('id', user.id)
    .single()) as {
    data: { household_id: string | null; current_paycycle_id: string | null } | null;
  };

  if (!profile?.household_id) {
    return { household: null, paycycle: null, seeds: [], pots: [], repayments: [] };
  }

  const householdId = profile.household_id;
  let paycycleId = profile.current_paycycle_id;

  if (!paycycleId) {
    const { data: activeCycle } = (await supabase
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()) as { data: { id: string } | null };
    paycycleId = activeCycle?.id ?? null;
  }

  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()) as { data: Household | null };

  if (!household) {
    return { household: null, paycycle: null, seeds: [], pots: [], repayments: [] };
  }

  let paycycle: PayCycle | null = null;
  let seeds: Seed[] = [];

  if (paycycleId) {
    const { data: paycycleData } = await supabase
      .from('paycycles')
      .select('*')
      .eq('id', paycycleId)
      .single();
    paycycle = paycycleData ? (paycycleData as PayCycle) : null;

    const { data: seedsData } = await supabase
      .from('seeds')
      .select('*')
      .eq('paycycle_id', paycycleId)
      .order('created_at', { ascending: true });
    seeds = (seedsData ?? []) as Seed[];
  }

  const { data: potsData } = await supabase
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  const pots = (potsData ?? []) as Pot[];

  const { data: repaymentsData } = await supabase
    .from('repayments')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  const repayments = (repaymentsData ?? []) as Repayment[];

  return {
    household,
    paycycle,
    seeds,
    pots,
    repayments,
  };
}
