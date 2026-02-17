import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PotForecastClient } from '@/components/forecast/pot-forecast-client';
import type { Household, Pot, PayCycle, Seed } from '@repo/supabase';

export default async function PotForecastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: potId } = await params;
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const supabase = await getCachedSupabase();

  const [potRes, householdRes, activeCycleRes, draftCycleRes] = await Promise.all([
    supabase.from('pots').select('*').eq('id', potId).eq('household_id', householdId).single(),
    supabase.from('households').select('*').eq('id', householdId).single(),
    supabase.from('paycycles').select('id').eq('household_id', householdId).eq('status', 'active').limit(1).maybeSingle(),
    supabase.from('paycycles').select('id').eq('household_id', householdId).eq('status', 'draft').limit(1).maybeSingle(),
  ]);

  const { data: pot } = potRes as { data: Pot | null };
  if (!pot) notFound();

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
        .eq('linked_pot_id', potId)
        .eq('is_recurring', true)
        .maybeSingle(),
    ]);
    const { data: paycycleData } = paycycleRes as { data: PayCycle | null };
    paycycle = paycycleData ?? null;
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
          Savings forecast
        </h1>
        <p className="text-muted-foreground">
          See when you&apos;ll reach your goal based on how much you save each pay cycle.
        </p>
      </div>
      <PotForecastClient
        pot={pot}
        household={household}
        paycycle={paycycle}
        linkedSeed={linkedSeed}
      />
    </div>
  );
}
