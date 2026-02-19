import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCachedDashboardAuth, getPaydayCompleteRequired } from '@/lib/auth/server-auth-cache';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';
import { redirect } from 'next/navigation';
import { DashboardHeaderNavClient, DashboardFooterClient } from './dashboard-shell-client';
import { DashboardContentTransition } from './dashboard-content-transition';
import { PaydayCompleteRedirect } from './payday-complete-redirect';

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

  return (
    <div className="min-h-screen bg-background">
      <PaydayCompleteRedirect shouldRedirectToPaydayComplete={shouldRedirectToPaydayComplete} />
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label="PLOT dashboard"
          >
            <Image
              src="/favicon-light.svg"
              alt=""
              width={28}
              height={28}
              className="dark:hidden shrink-0"
            />
            <Image
              src="/favicon-dark.svg"
              alt=""
              width={28}
              height={28}
              className="hidden dark:block shrink-0"
            />
            <span>PLOT</span>
          </Link>
          <DashboardHeaderNavClient
            userMenuProps={{
              user: {
                id: user.id,
                email,
                display_name: displayName,
                avatar_url: avatarUrl,
              },
              isPartner,
              trialTestingDashboardVisible,
              isAdmin: isAdmin ?? false,
            }}
          />
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1">
          <DashboardContentTransition>{children}</DashboardContentTransition>
        </div>
        <DashboardFooterClient />
      </div>
    </div>
  );
}
