import { redirect } from 'next/navigation';
import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { PaydayCompleteClient } from './payday-complete-client';

export const metadata = {
  title: 'Payday complete | PLOT',
  description: 'Start your next pay cycle',
};

/**
 * Payday-complete ritual: shown when the user's active cycle has finished —
 * either they closed the ritual or the cycle end_date is in the past. Guides
 * them to confirm blueprint (and resync if needed) then start the new cycle.
 */
export default async function PaydayCompletePage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const supabase = await getCachedSupabase();

  const [activeRes, draftRes] = await Promise.all([
    supabase
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('paycycles')
      .select('id')
      .eq('household_id', householdId)
      .eq('status', 'draft')
      .maybeSingle(),
  ]);

  const activeCycle = activeRes.data as { id: string } | null;
  const draftCycle = draftRes.data as { id: string } | null;

  if (!activeCycle) {
    redirect('/dashboard');
  }

  return (
    <PaydayCompleteClient
      activeCycleId={activeCycle.id}
      draftCycleId={draftCycle?.id ?? null}
    />
  );
}
