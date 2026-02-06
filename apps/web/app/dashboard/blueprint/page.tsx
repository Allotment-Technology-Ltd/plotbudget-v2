import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPartnerContext } from '@/lib/partner-context';
import { redirect } from 'next/navigation';
import { BlueprintClient } from '@/components/blueprint/blueprint-client';
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
  'household_id' | 'current_paycycle_id' | 'has_completed_onboarding'
>;

export default async function BlueprintPage({
  searchParams,
}: {
  searchParams: { cycle?: string };
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let householdId: string;
  let currentPaycycleId: string | null = null;

  if (user) {
    const { data: profile } = (await supabase
      .from('users')
      .select('household_id, current_paycycle_id, has_completed_onboarding')
      .eq('id', user.id)
      .single()) as { data: UserProfile | null };

    if (!profile?.has_completed_onboarding) redirect('/onboarding');
    if (!profile.household_id) redirect('/onboarding');
    householdId = profile.household_id;
    currentPaycycleId = profile.current_paycycle_id;
  } else {
    const { householdId: pid, isPartner } = await getPartnerContext();
    if (!isPartner || !pid) redirect('/login');
    householdId = pid;
    const admin = createAdminClient();
    const { data: activeCycle } = (await admin
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()) as { data: { id: string } | null };
    currentPaycycleId = activeCycle?.id ?? null;
  }

  const client = user ? supabase : createAdminClient();

  const { data: household } = await client
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (!household) redirect('/onboarding');

  const targetCycleId = searchParams.cycle || currentPaycycleId;
  if (!targetCycleId) redirect('/onboarding');

  const { data: paycycle } = await client
    .from('paycycles')
    .select('*')
    .eq('id', targetCycleId)
    .single();

  if (!paycycle) redirect('/dashboard');

  const { data: seeds } = await client
    .from('seeds')
    .select('*')
    .eq('paycycle_id', targetCycleId)
    .order('created_at', { ascending: true });

  const { data: potsData } = await client
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  const pots = (potsData ?? []) as Pot[];

  const { data: repaymentsData } = await client
    .from('repayments')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
  const repayments = (repaymentsData ?? []) as Repayment[];

  const { data: allPaycyclesData } = await client
    .from('paycycles')
    .select('id, name, start_date, end_date, status')
    .eq('household_id', householdId)
    .in('status', ['active', 'draft', 'completed', 'archived'])
    .order('start_date', { ascending: false });
  const allPaycycles = (allPaycyclesData ?? []) as PaycycleOption[];

  const activePaycycle = allPaycycles.find((p) => p.status === 'active');
  const hasDraftCycle = allPaycycles.some((p) => p.status === 'draft');

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
    />
  );
}
