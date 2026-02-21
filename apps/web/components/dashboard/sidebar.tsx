'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  PoundSterling,
  LayoutList,
  CheckSquare,
  Calendar,
  UtensilsCrossed,
  Plane,
  Archive,
  Baby,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { getModule, type ModuleId } from '@repo/logic';
import type { ModuleFlags } from '@/lib/module-flags';
import { UserMenu } from '@/components/navigation/user-menu';
import { cn } from '@repo/ui';

export type SidebarUserMenuProps = {
  user: { id: string; email: string; display_name: string | null; avatar_url: string | null };
  isPartner: boolean;
  trialTestingDashboardVisible?: boolean;
  isAdmin?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  moduleId?: ModuleId;
};

function buildNavItems(moduleFlags: ModuleFlags): NavItem[] {
  const items: NavItem[] = [];
  // Money (budgeting) first so it stays the primary experience
  if (moduleFlags.money) {
    items.push({ href: '/dashboard/money', label: 'Money', icon: PoundSterling, moduleId: 'money' });
    items.push({ href: '/dashboard/money/blueprint', label: 'Blueprint', icon: LayoutList, moduleId: 'money' });
  }
  if (moduleFlags.home) {
    items.push({ href: '/dashboard/home', label: 'Home', icon: Home, moduleId: 'home' });
  }
  if (moduleFlags.tasks) {
    items.push({ href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare, moduleId: 'tasks' });
  }
  if (moduleFlags.calendar) {
    items.push({ href: '/dashboard/calendar', label: 'Calendar', icon: Calendar, moduleId: 'calendar' });
  }
  if (moduleFlags.meals) {
    items.push({ href: '/dashboard/meals', label: 'Meals', icon: UtensilsCrossed, moduleId: 'meals' });
  }
  if (moduleFlags.holidays) {
    items.push({ href: '/dashboard/holidays', label: 'Holidays', icon: Plane, moduleId: 'holidays' });
  }
  if (moduleFlags.vault) {
    items.push({ href: '/dashboard/vault', label: 'Vault', icon: Archive, moduleId: 'vault' });
  }
  if (moduleFlags.kids) {
    items.push({ href: '/dashboard/kids', label: 'Kids', icon: Baby, moduleId: 'kids' });
  }
  return items;
}

interface SidebarProps {
  moduleFlags: ModuleFlags;
  userMenuProps: SidebarUserMenuProps;
}

export function Sidebar({ moduleFlags, userMenuProps }: SidebarProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(moduleFlags);

  return (
    <aside
      className="hidden lg:flex w-64 flex-col border-r border-border bg-card"
      aria-label="Sidebar navigation"
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
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
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const borderColor = item.moduleId ? getModule(item.moduleId).colorLight : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
              style={
                isActive && borderColor
                  ? { borderLeft: `3px solid ${borderColor}`, marginLeft: 2 }
                  : undefined
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
          aria-current={pathname.startsWith('/dashboard/settings') ? 'page' : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" aria-hidden />
          Settings
        </Link>
      </div>
      <div className="border-t border-border p-2">
        <UserMenu
          user={userMenuProps.user}
          isPartner={userMenuProps.isPartner}
          trialTestingDashboardVisible={userMenuProps.trialTestingDashboardVisible}
          isAdmin={userMenuProps.isAdmin}
        />
      </div>
    </aside>
  );
}
