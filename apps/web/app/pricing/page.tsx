import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPaymentUiVisibleFromEnv } from '@/lib/feature-flags';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'PLOT pricing: start free, unlock more pots when you need them.',
};

/**
 * Pricing page: gated by payment UI visibility (signup-gated off or dev override).
 * When payment UI is hidden, redirects to dashboard/login.
 * Placeholder content until pricing components (PricingMatrix, PWYLPricingMatrix,
 * PricingHeaderNavClient) are available on this branch.
 */
export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const paymentUiVisible = getPaymentUiVisibleFromEnv();
  if (!paymentUiVisible) {
    redirect(user ? '/dashboard' : '/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            PLOT
          </Link>
        </div>
      </header>

      <div className="content-wrapper py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="font-heading text-headline md:text-headline-lg uppercase tracking-wider text-foreground mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start with a free trial. Keep what works for you. Upgrade when you want more pots and no limits.
          </p>
          <Link
            href={user ? '/dashboard' : '/login'}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {user ? 'Back to dashboard' : 'Log in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
