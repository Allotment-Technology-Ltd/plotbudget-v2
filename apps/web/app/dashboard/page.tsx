import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { redirect } from 'next/navigation';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import { getIncomeEventsForCycle } from '@/lib/utils/income-projection';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id, has_completed_onboarding')
    .eq('id', user.id)
    .single()) as {
    data: {
      household_id: string | null;
      current_paycycle_id: string | null;
      has_completed_onboarding: boolean;
    } | null;
  };

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

  let ownerDisplayName: string | null = null;
  if (isPartner && household.owner_id) {
    const { data: ownerRow } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', household.owner_id)
      .single();
    ownerDisplayName = (ownerRow as { display_name: string | null } | null)?.display_name ?? null;
  }

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
    currentPaycycle = paycycle ? (paycycle as PayCycle) : null;

    if ((currentPaycycle as { status?: string } | null)?.status === 'active') {
      await markOverdueSeedsPaid(currentPaycycleId);
    }

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

  let incomeEvents: { sourceName: string; amount: number; date: string; payment_source: 'me' | 'partner' | 'joint' }[] = [];
  if (currentPaycycle) {
    const { data: incomeSources } = await supabase
      .from('income_sources')
      .select('id, name, amount, frequency_rule, day_of_month, anchor_date, payment_source')
      .eq('household_id', householdId)
      .eq('is_active', true);
    const sources = (incomeSources ?? []) as {
      id: string;
      name: string;
      amount: number;
      frequency_rule: 'specific_date' | 'last_working_day' | 'every_4_weeks';
      day_of_month: number | null;
      anchor_date: string | null;
      payment_source: 'me' | 'partner' | 'joint';
    }[];
    incomeEvents = getIncomeEventsForCycle(
      currentPaycycle.start_date,
      currentPaycycle.end_date,
      sources
    );
  }

  return (
    <DashboardClient
      household={household as Household}
      currentPaycycle={currentPaycycle}
      seeds={seeds}
      pots={pots ?? []}
      repayments={repayments ?? []}
      historicalCycles={historicalCycles}
      hasDraftCycle={hasDraftCycle}
      incomeEvents={incomeEvents}
      isPartner={isPartner}
      ownerDisplayName={ownerDisplayName}
    />
  );
}
