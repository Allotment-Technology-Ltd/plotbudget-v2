import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getCachedDashboardAuth, getPaydayCompleteRequired } from '@/lib/auth/server-auth-cache';
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
      <DashboardLayoutClient moduleFlags={moduleFlags} userMenuProps={userMenuProps}>
        {children}
      </DashboardLayoutClient>
    </>
  );
}
