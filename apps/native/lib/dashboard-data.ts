/**
 * Dashboard data fetching for native app.
 * Mirrors web dashboard page queries so data matches for same user.
 */

import { createSupabaseClient } from './supabase';
import type { Household, PayCycle, Seed } from '@repo/supabase';

export interface DashboardData {
  household: Household | null;
  currentPaycycle: PayCycle | null;
  seeds: Seed[];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { household: null, currentPaycycle: null, seeds: [] };
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id')
    .eq('id', user.id)
    .single()) as {
    data: { household_id: string | null; current_paycycle_id: string | null } | null;
  };

  if (!profile?.household_id) {
    return { household: null, currentPaycycle: null, seeds: [] };
  }

  const householdId = profile.household_id;
  let currentPaycycleId = profile.current_paycycle_id;

  if (!currentPaycycleId) {
    const { data: activeCycle } = (await supabase
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()) as { data: { id: string } | null };
    currentPaycycleId = activeCycle?.id ?? null;
  }

  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()) as { data: Household | null };

  if (!household) {
    return { household: null, currentPaycycle: null, seeds: [] };
  }

  let currentPaycycle: PayCycle | null = null;
  let seeds: Seed[] = [];

  if (currentPaycycleId) {
    const { data: paycycle } = await supabase
      .from('paycycles')
      .select('*')
      .eq('id', currentPaycycleId)
      .single();
    currentPaycycle = paycycle ? (paycycle as PayCycle) : null;

    const { data: seedsData } = await supabase
      .from('seeds')
      .select('*, pots(*), repayments(*)')
      .eq('paycycle_id', currentPaycycleId)
      .order('created_at', { ascending: false });
    seeds = seedsData ?? [];
  }

  return {
    household,
    currentPaycycle,
    seeds,
  };
}
