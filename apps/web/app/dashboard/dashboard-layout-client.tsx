'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ModuleTopBar } from '@/components/dashboard/module-top-bar';
import { ModuleDock } from '@/components/dashboard/module-dock';
import { UserMenu } from '@/components/navigation/user-menu';
import { ModuleFlagsProvider } from '@/contexts/module-flags-context';
import { DashboardFooterClient } from './dashboard-shell-client';
import { DashboardContentTransition } from './dashboard-content-transition';
import type { SidebarUserMenuProps } from '@/components/dashboard/sidebar';
import type { ModuleFlags } from '@/lib/module-flags';

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  moduleFlags: ModuleFlags;
  userMenuProps: SidebarUserMenuProps;
  unreadNotificationCount?: number;
};

/**
 * Launcher (exact /dashboard): minimal header + children, no sidebar or bottom nav.
 * Inside a module: single top bar (PLOT → launcher, in-module nav, user menu) + content + bottom nav (dock) + footer.
 */
export function DashboardLayoutClient({
  children,
  moduleFlags,
  userMenuProps,
  unreadNotificationCount = 0,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isLauncher = pathname === '/dashboard';
  const isCeremony = pathname?.includes('/tasks/weekly-reset') ?? false;

  const content = (
    <>
      {isCeremony ? (
        <div className="min-h-screen bg-background">{children}</div>
      ) : isLauncher ? (
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
                aria-label={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread ${unreadNotificationCount === 1 ? 'notification' : 'notifications'}` : 'Notifications'}
              >
                <Bell className="h-5 w-5" aria-hidden />
                {unreadNotificationCount > 0 && (
                  <span
                    className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
                    aria-hidden
                  >
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
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
          <ModuleDock moduleFlags={moduleFlags} />
          <DashboardFooterClient />
        </div>
      ) : (
        <div className="flex min-h-screen flex-col bg-background">
          <ModuleTopBar moduleFlags={moduleFlags} userMenuProps={userMenuProps} unreadNotificationCount={unreadNotificationCount} />
          <div className="flex-1">
            <DashboardContentTransition>{children}</DashboardContentTransition>
          </div>
          <ModuleDock moduleFlags={moduleFlags} />
          <DashboardFooterClient />
        </div>
      )}
    </>
  );

  return (
    <TooltipProvider>
      <ModuleFlagsProvider moduleFlags={moduleFlags}>{content}</ModuleFlagsProvider>
    </TooltipProvider>
  );
}
