/**
 * Blueprint (Pots) data fetching for native app.
 * Mirrors web blueprint page queries so data matches for same user.
 */

import { createSupabaseClient } from './supabase';
import type { Household, Pot } from '@repo/supabase';

export interface BlueprintData {
  household: Household | null;
  pots: Pot[];
}

export async function fetchBlueprintData(): Promise<BlueprintData> {
  const supabase = createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { household: null, pots: [] };
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .single()) as {
    data: { household_id: string | null } | null;
  };

  if (!profile?.household_id) {
    return { household: null, pots: [] };
  }

  const householdId = profile.household_id;

  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()) as { data: Household | null };

  if (!household) {
    return { household: null, pots: [] };
  }

  const { data: potsData } = await supabase
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  const pots = (potsData ?? []) as Pot[];

  return {
    household,
    pots,
  };
}
