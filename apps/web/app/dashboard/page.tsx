import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, current_paycycle_id, has_completed_onboarding')
    .eq('id', user.id)
    .single() as { data: { household_id: string | null; current_paycycle_id: string | null; has_completed_onboarding: boolean } | null };

  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user.id);

  let householdId: string;
  let currentPaycycleId: string | null = null;

  if (profile?.household_id) {
    householdId = profile.household_id;
    currentPaycycleId = profile.current_paycycle_id;
  } else if (isPartner && partnerHouseholdId) {
    householdId = partnerHouseholdId;
    const { data: activeCycle } = (await supabase
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()) as { data: { id: string } | null };
    currentPaycycleId = activeCycle?.id ?? null;
  } else {
    redirect('/onboarding');
  }

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (!household) redirect('/onboarding');

  let currentPaycycle: PayCycle | null = null;
  let seeds: Seed[] = [];
  let historicalCycles: Pick<
    PayCycle,
    'id' | 'name' | 'start_date' | 'end_date' | 'total_income' | 'total_allocated'
  >[] = [];

  if (currentPaycycleId) {
    const { data: paycycle } = await supabase
      .from('paycycles')
      .select('*')
      .eq('id', currentPaycycleId)
      .single();
    currentPaycycle = paycycle ?? null;

    const { data: seedsData } = await supabase
      .from('seeds')
      .select('*, pots(*), repayments(*)')
      .eq('paycycle_id', currentPaycycleId)
      .order('created_at', { ascending: false });
    seeds = seedsData ?? [];
  }

  const { data: pots } = await supabase
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .in('status', ['active', 'paused']);

  const { data: repayments } = await supabase
    .from('repayments')
    .select('*')
    .eq('household_id', householdId)
    .in('status', ['active', 'paused']);

  const { data: historical } = await supabase
    .from('paycycles')
    .select('id, name, start_date, end_date, total_income, total_allocated')
    .eq('household_id', householdId)
    .eq('status', 'completed')
    .order('start_date', { ascending: false })
    .limit(3);
  historicalCycles = historical ?? [];

  const { data: draftCycle } = await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle();
  const hasDraftCycle = !!draftCycle;

  return (
    <DashboardClient
      household={household as Household}
      currentPaycycle={currentPaycycle}
      seeds={seeds}
      pots={pots ?? []}
      repayments={repayments ?? []}
      historicalCycles={historicalCycles}
      hasDraftCycle={hasDraftCycle}
    />
  );
}
