'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

interface PWYLPricingMatrixProps {
  isLoggedIn: boolean;
  // household_id and user_id are resolved server-side in /api/checkout (auth required)
  householdId?: string | null;
  userId?: string | null;
}

const TRIAL_TIER = {
  id: 'trial',
  name: 'Trial',
  tagline: 'Your first 2 pay cycles',
  description: 'Try the full experience with unlimited bills and wants so you can set up your budget and run your first rituals.',
  limits: [
    'Unlimited bills & essentials (Needs)',
    'Unlimited discretionary items (Wants)',
    '5 savings pots',
    '5 repayments',
  ],
  cta: 'Included when you start',
};

const FREE_TIER = {
  id: 'free',
  name: 'Free',
  tagline: 'After your trial',
  description: 'Keep plotting with a simpler setup. Enough for the essentials—upgrade anytime you want more pots.',
  limits: [
    '5 bills & essentials (Needs)',
    '5 discretionary items (Wants)',
    '2 savings pots',
    '2 repayments',
  ],
  cta: 'Always free',
};

export function PWYLPricingMatrix({ isLoggedIn }: PWYLPricingMatrixProps) {
  // Checkout route is authenticated; it resolves household_id and user_id server-side.
  // No need to pass them as query params (prevents IDOR).
  const checkoutUrl = '/api/checkout?product=pwyl';

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      {/* Trial Tier */}
      <div className="relative flex flex-col rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md md:p-8">
        <div className="mb-4">
          <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
            {TRIAL_TIER.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{TRIAL_TIER.tagline}</p>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">{TRIAL_TIER.description}</p>
        <ul className="mb-6 space-y-3 flex-1">
          {TRIAL_TIER.limits.map((limit) => (
            <li key={limit} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-foreground">{limit}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{TRIAL_TIER.cta}</p>
      </div>

      {/* Free Tier */}
      <div className="relative flex flex-col rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md md:p-8">
        <div className="mb-4">
          <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
            {FREE_TIER.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{FREE_TIER.tagline}</p>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">{FREE_TIER.description}</p>
        <ul className="mb-6 space-y-3 flex-1">
          {FREE_TIER.limits.map((limit) => (
            <li key={limit} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-foreground">{limit}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{FREE_TIER.cta}</p>
      </div>

      {/* Premium PWYL Tier */}
      <div className="relative flex flex-col rounded-xl border border-primary ring-2 ring-primary/20 bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md md:p-8">
        {/* Highlighted Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Most flexible
        </div>

        <div className="mb-4">
          <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
            Premium
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Pay what you want</p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Support PLOT with your chosen monthly contribution. Choose any amount when you checkout.
          </p>
          
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              You decide the price
            </p>
            <p className="text-xs text-muted-foreground">
              Choose your contribution at checkout
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          No limits. Add as many bills, wants, savings goals, and repayments as you need. One price for the whole household.
        </p>

        <ul className="mb-6 space-y-3 flex-1">
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground">Unlimited Needs</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground">Unlimited Wants</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground">Unlimited savings pots</span>
          </li>
          <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground">Unlimited repayments</span>
          </li>
        </ul>

        {isLoggedIn ? (
          <Link
            href={checkoutUrl}
            className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start Premium
          </Link>
        ) : (
          <Link
            href="/signup"
            className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Get started
          </Link>
        )}
      </div>
    </div>
  );
}
