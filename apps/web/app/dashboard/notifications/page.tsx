import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { NotificationsPageClient } from '@/components/notifications/notifications-page-client';
import type { Notification } from '@repo/supabase';

export const metadata = {
  title: 'Notifications | PLOT',
  description: 'Your notifications',
};

export default async function NotificationsPage() {
  const { user, profile, owned, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const supabase = await getCachedSupabase();
  const isPartner = !owned && !!partnerOf;
  const partnerHouseholdId = partnerOf?.id ?? null;
  let householdId: string | null =
    profile?.household_id ?? (isPartner && partnerHouseholdId ? partnerHouseholdId : null);

  if (!householdId) redirect('/onboarding');

  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, source_module, action_url, is_read, created_at')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Notifications fetch failed:', error);
  }

  const notifications = (data ?? []) as Pick<
    Notification,
    'id' | 'title' | 'body' | 'source_module' | 'action_url' | 'is_read' | 'created_at'
  >[];

  return (
    <NotificationsPageClient
      notifications={notifications}
      userId={user.id}
    />
  );
}
