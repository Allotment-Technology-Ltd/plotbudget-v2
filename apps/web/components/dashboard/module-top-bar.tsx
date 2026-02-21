'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Calendar as CalendarIcon, CheckSquare, FolderKanban, LayoutList, PoundSterling } from 'lucide-react';
import { UserMenu } from '@/components/navigation/user-menu';
import { cn } from '@repo/ui';
import type { SidebarUserMenuProps } from './sidebar';

interface ModuleTopBarProps {
  userMenuProps: SidebarUserMenuProps;
  unreadNotificationCount?: number;
}

/**
 * Single top bar when inside a module (no sidebar). PLOT → launcher, in-module nav, notifications, user menu.
 */
export function ModuleTopBar({ userMenuProps, unreadNotificationCount = 0 }: ModuleTopBarProps) {
  const pathname = usePathname();
  const inMoney = pathname.startsWith('/dashboard/money');
  const isBlueprint = pathname.startsWith('/dashboard/money/blueprint');
  const inTasks = pathname.startsWith('/dashboard/tasks');
  const isProjects = pathname.startsWith('/dashboard/tasks/projects');
  const isWeeklyReset = pathname.startsWith('/dashboard/tasks/weekly-reset');
  const inCalendar = pathname.startsWith('/dashboard/calendar');
  const moduleNav = inMoney ? (
    <nav className="flex items-center gap-1" aria-label="Money">
      <Link
        href="/dashboard/money"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          !isBlueprint
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        aria-current={!isBlueprint ? 'page' : undefined}
      >
        <PoundSterling className="h-4 w-4 shrink-0" aria-hidden />
        <span>Overview</span>
      </Link>
      <Link
        href="/dashboard/money/blueprint"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isBlueprint
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        aria-current={isBlueprint ? 'page' : undefined}
      >
        <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
        <span>Blueprint</span>
      </Link>
    </nav>
  ) : inTasks && !isWeeklyReset ? (
    <nav className="flex items-center gap-1" aria-label="Tasks">
      <Link
        href="/dashboard/tasks"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          !isProjects
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        aria-current={!isProjects ? 'page' : undefined}
      >
        <CheckSquare className="h-4 w-4 shrink-0" aria-hidden />
        <span>Tasks</span>
      </Link>
      <Link
        href="/dashboard/tasks/projects"
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isProjects
            ? 'bg-muted text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        )}
        aria-current={isProjects ? 'page' : undefined}
      >
        <FolderKanban className="h-4 w-4 shrink-0" aria-hidden />
        <span>Projects</span>
      </Link>
    </nav>
  ) : inCalendar ? (
    <nav className="flex items-center gap-1" aria-label="Calendar">
      <Link
        href="/dashboard/calendar"
        className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground"
        aria-current="page"
      >
        <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span>Calendar</span>
      </Link>
    </nav>
  ) : null;

  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 rounded font-heading text-lg uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Back to home"
          >
            <Image
              src="/favicon-light.svg"
              alt=""
              width={24}
              height={24}
              className="shrink-0 dark:hidden"
            />
            <Image
              src="/favicon-dark.svg"
              alt=""
              width={24}
              height={24}
              className="hidden shrink-0 dark:block"
            />
            <span className="hidden sm:inline">PLOT</span>
          </Link>
          <div className="hidden min-w-0 sm:flex">{moduleNav}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
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
            user={userMenuProps.user}
            isPartner={userMenuProps.isPartner}
            trialTestingDashboardVisible={userMenuProps.trialTestingDashboardVisible}
            isAdmin={userMenuProps.isAdmin}
          />
        </div>
      </div>
      {moduleNav && (
        <div className="border-t border-border px-2 pb-2 sm:hidden">
          <div className="scrollbar-hide -mx-2 overflow-x-auto px-2 pt-2">{moduleNav}</div>
        </div>
      )}
    </header>
  );
}
