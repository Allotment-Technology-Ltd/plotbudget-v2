import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { getAvatarInitials } from '@/lib/utils/avatar-initials';
import { formatDisplayNameForLabel } from '@/lib/utils/display-name';
import { redirect } from 'next/navigation';
import { BlueprintClient } from '@/components/blueprint/blueprint-client';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import { getIncomeEventsForCycle } from '@/lib/utils/income-projection';
import type { Database } from '@repo/supabase';

type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];
type PaycycleRow = Database['public']['Tables']['paycycles']['Row'];
type HouseholdRow = Database['public']['Tables']['households']['Row'];
type SeedRow = Database['public']['Tables']['seeds']['Row'];
type PaycycleOption = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
};

export default async function MoneyBlueprintPage({
  searchParams,
}: {
  searchParams: Promise<{
    cycle?: string;
    edit?: string;
    editPot?: string;
    editRepayment?: string;
    newCycle?: string;
  }>;
}) {
  const params = await searchParams;
  const { user, profile, owned, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const supabase = await getCachedSupabase();
  const isPartner = !owned && !!partnerOf;
  const partnerHouseholdId = partnerOf?.id ?? null;
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

  const targetCycleId = params.cycle || currentPaycycleId;
  if (!targetCycleId) redirect('/onboarding');

  const [
    householdRes,
    paycycleRes,
    seedsRes,
    potsRes,
    repaymentsRes,
    allPaycyclesRes,
    incomeSourcesRes,
  ] = await Promise.all([
    supabase.from('households').select('*').eq('id', householdId).single(),
    supabase.from('paycycles').select('*').eq('id', targetCycleId).single(),
    supabase.from('seeds').select('*').eq('paycycle_id', targetCycleId).order('created_at', { ascending: true }),
    supabase.from('pots').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
    supabase.from('repayments').select('*').eq('household_id', householdId).order('created_at', { ascending: false }),
    supabase
      .from('paycycles')
      .select('id, name, start_date, end_date, status')
      .eq('household_id', householdId)
      .in('status', ['active', 'draft', 'completed', 'archived'])
      .order('start_date', { ascending: false }),
    supabase
      .from('income_sources')
      .select('id, name, amount, frequency_rule, day_of_month, anchor_date, payment_source')
      .eq('household_id', householdId)
      .eq('is_active', true),
  ]);

  const { data: householdData } = householdRes as { data: HouseholdRow | null };
  if (!householdData) redirect('/onboarding');
  const household = householdData;

  const { data: paycycleData } = paycycleRes as { data: PaycycleRow | null };
  if (!paycycleData) redirect('/dashboard/money');
  const paycycle = paycycleData;
  const paycycleRow = paycycle as { id: string; status: string };
  if (paycycleRow.status === 'active') {
    await markOverdueSeedsPaid(paycycleRow.id, undefined, { skipRevalidate: true });
  }

  const seeds = (seedsRes.data ?? []) as SeedRow[];
  const pots = (potsRes.data ?? []) as Pot[];
  const repayments = (repaymentsRes.data ?? []) as Repayment[];
  const allPaycycles = (allPaycyclesRes.data ?? []) as PaycycleOption[];

  let ownerDisplayName: string | null = null;
  if (household.owner_id) {
    const { data: ownerRow } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', household.owner_id)
      .single();
    ownerDisplayName = (ownerRow as { display_name: string | null } | null)?.display_name ?? null;
  }
  const ownerLabel = formatDisplayNameForLabel(ownerDisplayName, 'Account owner');
  const partnerLabel = formatDisplayNameForLabel(household.partner_name, 'Partner');

  const activePaycycle = allPaycycles.find((p) => p.status === 'active');
  const hasDraftCycle = allPaycycles.some((p) => p.status === 'draft');
  const editSeedId = params.edit ?? null;
  const editPotId = params.editPot ?? null;
  const editRepaymentId = params.editRepayment ?? null;
  const userEmail = user.email ?? '';
  const userInitials = getAvatarInitials(profile?.display_name ?? null, userEmail);
  const showNewCycleCelebration = params.newCycle != null;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const paycycleEnd = new Date(paycycle.end_date);
  const showRitualGreeting =
    paycycle.status === 'active' &&
    !(paycycle as { ritual_closed_at?: string | null }).ritual_closed_at &&
    paycycleEnd <= threeDaysFromNow &&
    paycycleEnd >= now;

  const sources = (incomeSourcesRes.data ?? []) as {
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
      initialEditPotId={editPotId}
      initialEditRepaymentId={editRepaymentId}
      initialNewCycleCelebration={showNewCycleCelebration}
      showRitualGreeting={showRitualGreeting}
      incomeEvents={incomeEvents}
      isPartner={isPartner}
      ownerLabel={ownerLabel}
      partnerLabel={partnerLabel}
    />
  );
}
