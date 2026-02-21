import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { TasksPageClient } from '@/components/tasks/tasks-page-client';

export const metadata = {
  title: 'Tasks',
  description: 'Chores, to-dos and projects',
};

export type AssigneeLabels = {
  me: string;
  partner: string;
  both: string;
  unassigned: string;
};

export default async function TasksPage() {
  const { user, profile, owned, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

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
      myName = (profile?.display_name ?? '').trim() || 'Me';
      partnerName = (h.partner_name ?? '').trim() || 'Partner';
    } else if (partnerOf) {
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

  return <TasksPageClient assigneeLabels={assigneeLabels} />;
}
