import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import { getAvatarEnabledFromEnv } from '@/lib/feature-flags';
import { redirect } from 'next/navigation';
import { BlueprintClient } from '@/components/blueprint/blueprint-client';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import type { Database } from '@/lib/supabase/database.types';

type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];
type PaycycleOption = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
};

type UserProfile = Pick<
  Database['public']['Tables']['users']['Row'],
  'household_id' | 'current_paycycle_id' | 'has_completed_onboarding' | 'avatar_url'
>;

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: { cycle?: string; edit?: string; newCycle?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id, has_completed_onboarding, avatar_url')
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

  const { data: household } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (!household) redirect('/onboarding');

  const targetCycleId = searchParams.cycle || currentPaycycleId;
  if (!targetCycleId) redirect('/onboarding');

  const { data: paycycle } = await supabase
    .from('paycycles')
    .select('*')
    .eq('id', targetCycleId)
    .single();

  if (!paycycle) redirect('/dashboard');

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
  const avatarEnabled = getAvatarEnabledFromEnv();

  const editSeedId = searchParams.edit ?? null;
  const showNewCycleCelebration = searchParams.newCycle != null;

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
      userAvatarUrl={avatarEnabled ? profile?.avatar_url ?? null : null}
      avatarEnabled={avatarEnabled}
      initialEditSeedId={editSeedId}
      initialNewCycleCelebration={showNewCycleCelebration}
    />
  );
}
