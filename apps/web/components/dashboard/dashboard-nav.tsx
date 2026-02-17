'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/blueprint', label: 'Blueprint' },
];

/**
 * Uses plain <a> for nav links so they work reliably in Safari PWA on Mac,
 * where client-side Link navigation can fail to be recognized as a link.
 */
export function DashboardNav() {
  const pathname = usePathname();

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
          <a
            key={item.href}
            href={item.href}
            className={linkClassName}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
