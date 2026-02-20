/**
 * Dev-only layout: trial testing dashboard.
 * 404 when not in develop/local; requires auth.
 */
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';

export default async function DevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isTrialTestingDashboardAllowed()) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            PLOT
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium uppercase tracking-wider">
              Dev Tools
            </span>
          </nav>
        </div>
      </header>
      <div className="content-wrapper section-padding">{children}</div>
    </div>
  );
}
