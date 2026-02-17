'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/blueprint', label: 'Blueprint' },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { setNavigating } = useNavigationProgress();

  return (
    <nav className="flex gap-6" aria-label="Main navigation">
      {navItems.map((item) => {
        const isExternal = 'external' in item && item.external;
        const isActive =
          !isExternal &&
          (item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href));
        const linkClassName =
          isActive
            ? 'text-primary font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded'
            : 'text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded';
        return isExternal ? (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {item.label}
          </a>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={linkClassName}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setNavigating(true)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
