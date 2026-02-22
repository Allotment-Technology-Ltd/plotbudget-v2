'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Calendar as CalendarIcon, CheckSquare, FolderKanban, LayoutList, PoundSterling, UtensilsCrossed } from 'lucide-react';
import { UserMenu } from '@/components/navigation/user-menu';
import { cn } from '@repo/ui';
import type { ModuleFlags } from '@/lib/module-flags';
import type { SidebarUserMenuProps } from './sidebar';

interface ModuleTopBarProps {
  moduleFlags: ModuleFlags;
  userMenuProps: SidebarUserMenuProps;
  unreadNotificationCount?: number;
}

/**
 * Single top bar when inside a module (no sidebar). PLOT → launcher, in-module nav, notifications, user menu.
 */
export function ModuleTopBar({ moduleFlags, userMenuProps, unreadNotificationCount = 0 }: ModuleTopBarProps) {
  const pathname = usePathname();
  const inMoney = pathname.startsWith('/dashboard/money');
  const isBlueprint = pathname.startsWith('/dashboard/money/blueprint');
  const inTasks = pathname.startsWith('/dashboard/tasks');
  const isProjects = pathname.startsWith('/dashboard/tasks/projects');
  const isWeeklyReset = pathname.startsWith('/dashboard/tasks/weekly-reset');
  const inCalendar = pathname.startsWith('/dashboard/calendar');
  const inMeals = pathname.startsWith('/dashboard/meals');

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4">
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-heading text-lg uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label="Back to home"
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
          <span className="inline sm:hidden">Home</span>
          <span className="hidden sm:inline">PLOT</span>
        </Link>
        {inMoney && (
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
        )}
        {inTasks && !isWeeklyReset && (
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
        )}
        {inCalendar && (
          <nav className="flex items-center gap-1" aria-label="Calendar">
            <Link
              href="/dashboard/calendar"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-muted text-foreground"
              aria-current="page"
            >
              <CalendarIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span>Calendar</span>
            </Link>
          </nav>
        )}
        {inMeals && moduleFlags.meals && (
          <nav className="flex items-center gap-1" aria-label="Meals">
            <Link
              href="/dashboard/meals"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-muted text-foreground"
              aria-current="page"
            >
              <UtensilsCrossed className="h-4 w-4 shrink-0" aria-hidden />
              <span>Meals</span>
            </Link>
          </nav>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
    </header>
  );
}
