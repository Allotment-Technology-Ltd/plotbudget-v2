import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getCachedDashboardAuth, getCachedSupabase, getPaydayCompleteRequired } from '@/lib/auth/server-auth-cache';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';
import { getServerModuleFlags } from '@/lib/posthog-server-flags';
import { redirect } from 'next/navigation';
import { PaydayCompleteRedirect } from './payday-complete-redirect';
import { DashboardLayoutClient } from './dashboard-layout-client';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your PLOT dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, owned, partnerOf, isAdmin } = await getCachedDashboardAuth();
  if (!user) redirect('/login');

  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  const shouldRedirectToPaydayComplete =
    !!householdId && (await getPaydayCompleteRequired(householdId));

  const email = user.email ?? '';
  let displayName = profile?.display_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const isPartner = !owned && !!partnerOf;
  if (isPartner && partnerOf) {
    displayName = (partnerOf.partner_name ?? displayName ?? 'Partner').trim() || 'Partner';
  }

  const trialTestingDashboardVisible = isTrialTestingDashboardAllowed();
  const cookieStore = await cookies();
  const moduleFlags = await getServerModuleFlags(user.id, {
    cookies: cookieStore,
    isAdmin: isAdmin ?? false,
  });

  // Fetch unread notification count for the nav badge. Fail silently — a missing badge
  // is better than a broken layout. Only fetch when there is a household to scope the query.
  let unreadNotificationCount = 0;
  if (householdId) {
    try {
      const supabase = await getCachedSupabase();
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .eq('user_id', user.id)
        .eq('is_read', false);
      unreadNotificationCount = count ?? 0;
    } catch {
      // non-fatal — badge simply won't show
    }
  }

  const userMenuProps = {
    user: {
      id: user.id,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
    isPartner,
    trialTestingDashboardVisible,
    isAdmin: isAdmin ?? false,
  };

  return (
    <>
      <PaydayCompleteRedirect shouldRedirectToPaydayComplete={shouldRedirectToPaydayComplete} />
      <DashboardLayoutClient moduleFlags={moduleFlags} userMenuProps={userMenuProps} unreadNotificationCount={unreadNotificationCount}>
        {children}
      </DashboardLayoutClient>
    </>
  );
}
