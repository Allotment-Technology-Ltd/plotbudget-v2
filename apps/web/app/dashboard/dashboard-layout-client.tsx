'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { ModuleTopBar } from '@/components/dashboard/module-top-bar';
import { UserMenu } from '@/components/navigation/user-menu';
import { DashboardFooterClient } from './dashboard-shell-client';
import { DashboardContentTransition } from './dashboard-content-transition';
import type { SidebarUserMenuProps } from '@/components/dashboard/sidebar';
import type { ModuleFlags } from '@/lib/module-flags';

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  moduleFlags: ModuleFlags;
  userMenuProps: SidebarUserMenuProps;
};

/**
 * Launcher (exact /dashboard): minimal header + children, no sidebar or bottom nav.
 * Inside a module: single top bar (PLOT → launcher, in-module nav, user menu) + content + bottom nav on mobile. No sidebar.
 */
export function DashboardLayoutClient({
  children,
  moduleFlags: _moduleFlags,
  userMenuProps,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isLauncher = pathname === '/dashboard';
  const isCeremony = pathname?.includes('/tasks/weekly-reset') ?? false;

  if (isCeremony) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  if (isLauncher) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-heading text-lg uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="PLOT home"
          >
            <Image
              src="/favicon-light.svg"
              alt=""
              width={24}
              height={24}
              className="dark:hidden shrink-0"
            />
            <Image
              src="/favicon-dark.svg"
              alt=""
              width={24}
              height={24}
              className="hidden dark:block shrink-0"
            />
            <span>PLOT</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard/notifications"
              className="relative rounded p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" aria-hidden />
            </Link>
            <UserMenu
              user={userMenuProps.user}
              isPartner={userMenuProps.isPartner}
              trialTestingDashboardVisible={userMenuProps.trialTestingDashboardVisible}
              isAdmin={userMenuProps.isAdmin}
            />
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <DashboardFooterClient />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ModuleTopBar userMenuProps={userMenuProps} />
      <div className="flex-1">
        <DashboardContentTransition>{children}</DashboardContentTransition>
      </div>
      <DashboardFooterClient />
    </div>
  );
}
