import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { cookies } from 'next/headers';
import { getServerModuleFlags } from '@/lib/posthog-server-flags';
import { redirect } from 'next/navigation';
import { HomeFeedClient } from '@/components/home/home-feed-client';
import type { ActivityFeed, Notification } from '@repo/supabase';

/** Calm Design Rule 1: Cap activity on Home to avoid rewarding browsing. */
const HOME_ACTIVITY_LIMIT = 5;

export default async function DashboardHomePage() {
  const { user, profile, owned, partnerOf, isAdmin } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const cookieStore = await cookies();
  const moduleFlags = await getServerModuleFlags(user.id, {
    cookies: cookieStore,
    isAdmin,
  });
  if (!moduleFlags.home) redirect('/dashboard/money');

  const supabase = await getCachedSupabase();
  const isPartner = !owned && !!partnerOf;
  const partnerHouseholdId = partnerOf?.id ?? null;
  let householdId: string;

  if (profile?.household_id) {
    householdId = profile.household_id;
  } else if (isPartner && partnerHouseholdId) {
    householdId = partnerHouseholdId;
  } else {
    redirect('/onboarding');
  }

  const householdRes = await supabase
    .from('households')
    .select('id, partner_name')
    .eq('id', householdId)
    .single();
  const household = householdRes.data as { id: string; partner_name: string | null } | null;
  if (!household) redirect('/onboarding');

  const [
    notificationsRes,
    activityRes,
    unpaidSeedsRes,
    activePaycycleRes,
  ] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, action_url, created_at')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('activity_feed')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(HOME_ACTIVITY_LIMIT),
    profile?.current_paycycle_id
      ? supabase
          .from('seeds')
          .select('id', { count: 'exact', head: true })
          .eq('paycycle_id', profile.current_paycycle_id)
          .eq('is_paid', false)
      : Promise.resolve({ count: 0 }),
    supabase
      .from('paycycles')
      .select('id, end_date, ritual_closed_at')
      .eq('household_id', householdId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ]);

  const unreadNotifications = (notificationsRes.data ?? []) as Pick<
    Notification,
    'id' | 'title' | 'body' | 'action_url' | 'created_at'
  >[];
  const activityFeed = (activityRes.data ?? []) as ActivityFeed[];
  const unpaidSeedsCount =
    typeof unpaidSeedsRes.count === 'number' ? unpaidSeedsRes.count : 0;
  const activePaycycle = activePaycycleRes.data as {
    id: string;
    end_date: string;
    ritual_closed_at: string | null;
  } | null;

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const paydayRitualReady =
    !!activePaycycle &&
    !activePaycycle.ritual_closed_at &&
    new Date(activePaycycle.end_date) <= threeDaysFromNow &&
    new Date(activePaycycle.end_date) >= now;

  return (
    <HomeFeedClient
      userId={user.id}
      partnerName={household.partner_name}
      unreadNotifications={unreadNotifications}
      activityFeed={activityFeed}
      unpaidSeedsCount={unpaidSeedsCount}
      paydayRitualReady={paydayRitualReady}
      activePaycycleId={activePaycycle?.id ?? null}
    />
  );
}
