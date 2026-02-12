'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

interface PricingMatrixProps {
  pricingEnabled: boolean;
  isLoggedIn: boolean;
  householdId?: string | null;
  userId?: string | null;
}

const TIERS = [
  {
    id: 'trial',
    name: 'Trial',
    tagline: 'Your first 2 pay cycles',
    price: null,
    priceSecondary: null,
    description: 'Try the full experience with unlimited bills and wants so you can set up your budget and run your first rituals.',
    limits: [
      'Unlimited bills & essentials (Needs)',
      'Unlimited discretionary items (Wants)',
      '5 savings pots',
      '5 repayments',
    ],
    cta: 'Included when you start',
    ctaLink: null,
    highlighted: false,
  },
  {
    id: 'free',
    name: 'Free',
    tagline: 'After your trial',
    price: null,
    priceSecondary: null,
    description: 'Keep plotting with a simpler setup. Enough for the essentials—upgrade anytime you want more pots.',
    limits: [
      '5 bills & essentials (Needs)',
      '5 discretionary items (Wants)',
      '2 savings pots',
      '2 repayments',
    ],
    cta: 'Always free',
    ctaLink: null,
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Unlimited pots',
    price: '£4.99',
    period: '/ month',
    priceSecondary: '£49.99/year',
    priceSecondaryNote: 'Billed annually — save 2 months',
    description: 'No limits. Add as many bills, wants, savings goals, and repayments as you need. One price for the whole household.',
    limits: [
      'Unlimited Needs',
      'Unlimited Wants',
      'Unlimited savings pots',
      'Unlimited repayments',
    ],
    cta: 'Upgrade to Premium',
    ctaLink: '/api/checkout?product=monthly',
    highlighted: true,
  },
] as const;

type PricingTier = (typeof TIERS)[number];

function tierHasCtaLink(tier: PricingTier): tier is PricingTier & { ctaLink: string } {
  return typeof tier.ctaLink === 'string' && tier.ctaLink.length > 0;
}

export function PricingMatrix({ pricingEnabled, isLoggedIn, householdId, userId }: PricingMatrixProps) {
  const premiumCtaHref = householdId
    ? `/api/checkout?product=monthly&household_id=${encodeURIComponent(householdId)}${userId ? `&user_id=${encodeURIComponent(userId)}` : ''}`
    : '/api/checkout?product=monthly';

  return (
    <div className="grid gap-6 md:grid-cols-3 md:gap-8">
      {TIERS.map((tier: PricingTier) => {
        const hasCtaLink = tierHasCtaLink(tier);

        return (
          <div
            key={tier.id}
            className={`relative flex flex-col rounded-xl border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md md:p-8 ${
              tier.highlighted
                ? 'border-primary ring-2 ring-primary/20'
              : 'border-border'
          }`}
        >
          {tier.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
              Most flexible
            </div>
          )}
          <div className="mb-4">
            <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
              {tier.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
            {tier.price != null && (
              <div className="mt-3 space-y-1">
                <p className="flex items-baseline gap-1">
                  <span className="font-heading text-3xl uppercase tracking-wide text-foreground">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-muted-foreground">{tier.period}</span>
                  )}
                </p>
                {'priceSecondary' in tier && tier.priceSecondary && (
                  <p className="text-sm text-muted-foreground">
                    or {tier.priceSecondary}
                    {'priceSecondaryNote' in tier && tier.priceSecondaryNote && (
                      <span className="block text-xs mt-0.5">{tier.priceSecondaryNote}</span>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <p className="mb-6 text-sm text-muted-foreground">{tier.description}</p>
          <ul className="mb-6 space-y-3 flex-1">
            {tier.limits.map((limit) => (
              <li key={limit} className="flex items-start gap-2 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="text-foreground">{limit}</span>
              </li>
            ))}
          </ul>
          {hasCtaLink && pricingEnabled && isLoggedIn ? (
            <Link
              href={tier.id === 'premium' ? premiumCtaHref : tier.ctaLink}
              className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {tier.cta}
            </Link>
          ) : hasCtaLink && pricingEnabled && !isLoggedIn ? (
            <Link
              href="/signup"
              className="inline-flex justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{tier.cta}</p>
          )}
        </div>
        );
      })}
    </div>
  );
}
