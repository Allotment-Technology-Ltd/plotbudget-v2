import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
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
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const supabase = await getCachedSupabase();

  const [repaymentRes, householdRes, activeCycleRes, draftCycleRes] = await Promise.all([
    supabase.from('repayments').select('*').eq('id', repaymentId).eq('household_id', householdId).single(),
    supabase.from('households').select('*').eq('id', householdId).single(),
    supabase.from('paycycles').select('id').eq('household_id', householdId).eq('status', 'active').limit(1).maybeSingle(),
    supabase.from('paycycles').select('id').eq('household_id', householdId).eq('status', 'draft').limit(1).maybeSingle(),
  ]);

  const { data: repayment } = repaymentRes as { data: Repayment | null };
  if (!repayment) notFound();

  const { data: household } = householdRes as { data: Household | null };
  if (!household) redirect('/onboarding');

  const activeCycle = activeCycleRes.data as { id: string } | null;
  const draftCycle = draftCycleRes.data as { id: string } | null;
  const paycycleId = activeCycle?.id ?? draftCycle?.id ?? profile?.current_paycycle_id;
  let paycycle: PayCycle | null = null;
  let linkedSeed: Seed | null = null;

  if (paycycleId) {
    const [paycycleRes, seedRes] = await Promise.all([
      supabase.from('paycycles').select('*').eq('id', paycycleId).single(),
      supabase
        .from('seeds')
        .select('*')
        .eq('paycycle_id', paycycleId)
        .eq('linked_repayment_id', repaymentId)
        .eq('is_recurring', true)
        .maybeSingle(),
    ]);
    const { data: pc } = paycycleRes as { data: PayCycle | null };
    paycycle = pc ?? null;
    const { data: seed } = seedRes as { data: Seed | null };
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
