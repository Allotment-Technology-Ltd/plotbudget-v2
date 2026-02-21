import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { ResetFlow } from '@/components/tasks/weekly-reset/reset-flow';
import type { AssigneeLabels } from '@/app/dashboard/tasks/page';

export const metadata = {
  title: 'Weekly Reset',
  description: 'Sort out the week ahead',
};

export default async function WeeklyResetPage() {
  const { user, profile, owned, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  let displayName = (profile?.display_name ?? '').trim() || 'there';
  let myName = 'Me';
  let partnerName = 'Partner';

  const supabase = await getCachedSupabase();
  const { data: household } = await supabase
    .from('households')
    .select('owner_id, partner_name')
    .eq('id', householdId)
    .single();

  if (household) {
    const h = household as { owner_id: string | null; partner_name: string | null };
    if (owned) {
      displayName = (profile?.display_name ?? '').trim() || 'there';
      myName = (profile?.display_name ?? '').trim() || 'Me';
      partnerName = (h.partner_name ?? '').trim() || 'Partner';
    } else if (partnerOf) {
      displayName = (partnerOf.partner_name ?? '').trim() || 'there';
      myName = (partnerOf.partner_name ?? '').trim() || 'Me';
      if (h.owner_id) {
        const { data: ownerRow } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', h.owner_id)
          .single();
        partnerName = (ownerRow as { display_name: string | null } | null)?.display_name?.trim() || 'Partner';
      }
    }
  }

  const assigneeLabels: AssigneeLabels = {
    me: myName,
    partner: partnerName,
    both: 'Both of us',
    unassigned: 'Unassigned',
  };

  return (
    <div data-ceremony="true" className="min-h-screen bg-background">
      <ResetFlow displayName={displayName} assigneeLabels={assigneeLabels} />
    </div>
  );
}
