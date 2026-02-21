'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { UserMenu } from '@/components/navigation/user-menu';
import type { SidebarUserMenuProps } from './sidebar';

interface MobileTopBarProps {
  userMenuProps: SidebarUserMenuProps;
  unreadNotificationCount?: number;
}

export function MobileTopBar({ userMenuProps, unreadNotificationCount = 0 }: MobileTopBarProps) {
  const { user, isPartner, trialTestingDashboardVisible, isAdmin } = userMenuProps;

  return (
    <header className="flex lg:hidden h-14 items-center justify-between border-b border-border bg-card px-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-heading text-lg uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label="PLOT dashboard"
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
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative rounded p-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={unreadNotificationCount > 0 ? `${unreadNotificationCount} unread notifications` : 'Notifications'}
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
          user={user}
          isPartner={isPartner}
          trialTestingDashboardVisible={trialTestingDashboardVisible}
          isAdmin={isAdmin}
        />
      </div>
    </header>
  );
}
