import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { RepaymentForecastClient } from '@/components/forecast/repayment-forecast-client';
import type { Household, Repayment, PayCycle, Seed } from '@repo/supabase';

export default async function RepaymentForecastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: repaymentId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id')
    .eq('id', user.id)
    .single()) as {
    data: { household_id: string | null; current_paycycle_id: string | null } | null;
  };

  const householdId = profile?.household_id;
  if (!householdId) redirect('/onboarding');

  const { data: repayment } = (await supabase
    .from('repayments')
    .select('*')
    .eq('id', repaymentId)
    .eq('household_id', householdId)
    .single()) as { data: Repayment | null };

  if (!repayment) notFound();

  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()) as { data: Household | null };

  if (!household) redirect('/onboarding');

  const { data: activeCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  const { data: draftCycle } = (await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'draft')
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  const paycycleId = activeCycle?.id ?? draftCycle?.id ?? profile?.current_paycycle_id;
  let paycycle: PayCycle | null = null;
  let linkedSeed: Seed | null = null;

  if (paycycleId) {
    const { data: pc } = (await supabase
      .from('paycycles')
      .select('*')
      .eq('id', paycycleId)
      .single()) as { data: PayCycle | null };
    paycycle = pc ?? null;

    const { data: seed } = (await supabase
      .from('seeds')
      .select('*')
      .eq('paycycle_id', paycycleId)
      .eq('linked_repayment_id', repaymentId)
      .eq('is_recurring', true)
      .maybeSingle()) as { data: Seed | null };
    linkedSeed = seed ?? null;
  }

  return (
    <div className="content-wrapper section-padding space-y-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        ← Back to Dashboard
      </Link>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider text-foreground">
          Repayment forecast
        </h1>
        <p className="text-muted-foreground">
          See when you&apos;ll clear this debt based on how much you pay each cycle.
        </p>
      </div>
      <RepaymentForecastClient
        repayment={repayment}
        household={household}
        paycycle={paycycle}
        linkedSeed={linkedSeed}
      />
    </div>
  );
}
