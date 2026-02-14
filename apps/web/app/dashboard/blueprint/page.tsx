import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { getAvatarInitials } from '@/lib/utils/avatar-initials';
import { redirect } from 'next/navigation';
import { BlueprintClient } from '@/components/blueprint/blueprint-client';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import { getIncomeEventsForCycle } from '@/lib/utils/income-projection';
import type { Database } from '@/lib/supabase/database.types';

type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];
type PaycycleRow = Database['public']['Tables']['paycycles']['Row'];
type PaycycleOption = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
};

type UserProfile = Pick<
  Database['public']['Tables']['users']['Row'],
  'household_id' | 'current_paycycle_id' | 'has_completed_onboarding' | 'avatar_url' | 'display_name'
>;

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string; edit?: string; newCycle?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id, has_completed_onboarding, avatar_url, display_name')
    .eq('id', user.id)
    .single()) as { data: UserProfile | null };

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

  type HouseholdRow = Database['public']['Tables']['households']['Row'];
  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()) as { data: HouseholdRow | null };

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

  const targetCycleId = params.cycle || currentPaycycleId;
  if (!targetCycleId) redirect('/onboarding');

  const { data: paycycleData } = await supabase
    .from('paycycles')
    .select('*')
    .eq('id', targetCycleId)
    .single();

  if (!paycycleData) redirect('/dashboard');

  const paycycle = paycycleData as PaycycleRow;
  const paycycleRow = paycycle as { id: string; status: string };
  if (paycycleRow.status === 'active') {
    await markOverdueSeedsPaid(paycycleRow.id);
  }

  const { data: seeds } = await supabase
    .from('seeds')
    .select('*')
    .eq('paycycle_id', targetCycleId)
    .order('created_at', { ascending: true });

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

  const { data: allPaycyclesData } = await supabase
    .from('paycycles')
    .select('id, name, start_date, end_date, status')
    .eq('household_id', householdId)
    .in('status', ['active', 'draft', 'completed', 'archived'])
    .order('start_date', { ascending: false });
  const allPaycycles = (allPaycyclesData ?? []) as PaycycleOption[];

  const activePaycycle = allPaycycles.find((p) => p.status === 'active');
  const hasDraftCycle = allPaycycles.some((p) => p.status === 'draft');
  const editSeedId = params.edit ?? null;
  const userEmail = user.email ?? '';
  const userInitials = getAvatarInitials(profile?.display_name ?? null, userEmail);
  const showNewCycleCelebration = params.newCycle != null;

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
  const incomeEvents = getIncomeEventsForCycle(
    paycycle.start_date,
    paycycle.end_date,
    sources
  );

  return (
    <BlueprintClient
      household={household}
      paycycle={paycycle}
      seeds={seeds ?? []}
      pots={pots ?? []}
      repayments={repayments ?? []}
      allPaycycles={allPaycycles}
      activePaycycleId={activePaycycle?.id ?? null}
      hasDraftCycle={hasDraftCycle}
      userAvatarUrl={profile?.avatar_url ?? null}
      userInitials={userInitials}
      initialEditSeedId={editSeedId}
      initialNewCycleCelebration={showNewCycleCelebration}
      incomeEvents={incomeEvents}
      isPartner={isPartner}
      ownerDisplayName={ownerDisplayName}
    />
  );
}
