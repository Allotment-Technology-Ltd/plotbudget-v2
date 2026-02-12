'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface SubscriptionTabProps {
  subscription: {
    status: 'active' | 'cancelled' | 'past_due' | 'trialing' | null;
    current_tier: 'free' | 'pro' | null;
    trial_end_date: string | null;
    polar_product_id: string | null;
    metadata?: {
      pwyl_amount?: string;
      pricing_mode?: string;
    } | null;
  } | null;
  householdId: string;
  userId: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusBadgeVariant(status: string | null): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'default';
    case 'past_due':
      return 'destructive';
    case 'cancelled':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function SubscriptionTab({ subscription }: SubscriptionTabProps) {
  const tier = subscription?.current_tier ?? 'free';
  const status = subscription?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';
  const isPremium = tier === 'pro';
  
  // Determine pricing mode
  const pricingMode = subscription?.metadata?.pricing_mode ||
    (subscription?.polar_product_id === 'pwyl_free' ? 'pwyl' :
     subscription?.polar_product_id?.includes('pwyl') ? 'pwyl' : 'fixed');
  
  const pwylAmount = subscription?.metadata?.pwyl_amount
    ? parseFloat(subscription.metadata.pwyl_amount)
    : subscription?.polar_product_id === 'pwyl_free' ? 0 : null;
  
  const isPWYL = pricingMode === 'pwyl';
  const isFree = pwylAmount === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
          Subscription
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <p className="font-heading text-lg uppercase tracking-wide text-foreground">
                {tier === 'pro'
                  ? isPWYL && isFree
                    ? 'Premium (Free)'
                    : 'Premium'
                  : 'Free'}
              </p>
              {isPWYL && pwylAmount !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  {isFree
                    ? 'Community Supporter'
                    : `£${pwylAmount.toFixed(2)}/month`}
                </p>
              )}
            </div>
            {status && (
              <Badge variant={getStatusBadgeVariant(status)} className="uppercase">
                {status}
              </Badge>
            )}
          </div>

          {subscription && isActive && (
            <>
              {status === 'trialing' && subscription.trial_end_date && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Trial Ends</p>
                  <p className="text-sm text-foreground">{formatDate(subscription.trial_end_date)}</p>
                </div>
              )}

              {isPremium && (
                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Your household has unlimited pots and no limits on bills or wants.
                  </p>
                  
                  {isPWYL && isFree ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground italic">
                        Thank you for using PLOT. Consider contributing to support development.
                      </p>
                      <Link href="/pricing">
                        <Button>Start Contributing</Button>
                      </Link>
                    </div>
                  ) : isPWYL && pwylAmount ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground italic">
                        Thank you for contributing £{pwylAmount.toFixed(2)}/month!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <a
                          href="https://sandbox.polar.sh/subscriptions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Change Amount
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <a
                          href="https://sandbox.polar.sh/subscriptions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Manage Subscription
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <a
                      href="https://sandbox.polar.sh/subscriptions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Manage Subscription
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}

          {!isPremium && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to Premium for unlimited pots, bills, and wants.
              </p>
              <Link href="/pricing">
                <Button>View Pricing</Button>
              </Link>
            </div>
          )}

          {status === 'past_due' && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-destructive">
                Your payment is past due. Please update your payment method to continue using Premium features.
              </p>
              <a
                href="https://sandbox.polar.sh/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-6 py-3 font-heading text-cta uppercase tracking-widest text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Update Payment Method
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Your subscription has been cancelled. You can resubscribe anytime.
              </p>
              <Link href="/pricing">
                <Button>Resubscribe</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
