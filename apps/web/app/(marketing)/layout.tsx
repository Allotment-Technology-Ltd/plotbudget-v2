import Link from 'next/link';
import Image from 'next/image';
import { PricingHeaderNavClient } from '@/app/pricing/pricing-header-nav-client';

/**
 * Shared layout for all public marketing pages (e.g. /roadmap, /pricing).
 * Single header: PLOT logo + nav; main content uses content-wrapper / section-padding for consistency.
 * Auth state is fetched client-side by PricingHeaderNavClient to avoid blocking server fetches.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label="PLOT"
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
          <nav className="flex items-center gap-6" aria-label="Main navigation">
            <PricingHeaderNavClient />
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
