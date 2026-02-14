'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { currencySymbol } from '@/lib/utils/currency';

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
  /** Founding Member: Premium free until this date. First 50 users. */
  foundingMemberUntil?: string | null;
  /** Trial cycles completed (trial = first 2). */
  trialCyclesCompleted?: number;
  /** Trial ended timestamp. */
  trialEndedAt?: string | null;
  /** Grace period start timestamp (7 days after trial). */
  gracePeriodStart?: string | null;
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

// Authenticated server-side route that creates a Polar customer portal session
const PORTAL_URL = '/api/customer-portal';

function PortalLink({ 
  href, 
  className, 
  children 
}: { 
  href: string; 
  className: string; 
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    // Clear any previous error
    setError(null);
    
    // Navigate via Link component — the error handler in SettingsView will catch any issues
    // This wrapper is mainly for future enhancements (e.g., loading states)
  };

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

export function SubscriptionTab({
  subscription,
  foundingMemberUntil,
  trialCyclesCompleted = 0,
  trialEndedAt,
  gracePeriodStart,
}: SubscriptionTabProps) {
  const tier = subscription?.current_tier ?? 'free';
  const status = subscription?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';
  const isPremium = tier === 'pro';
  const isFoundingMember = foundingMemberUntil && new Date(foundingMemberUntil) > new Date();
  const effectivePremium = isPremium || isFoundingMember;
  
  // Determine pricing mode
  const pricingMode = subscription?.metadata?.pricing_mode ||
    (subscription?.polar_product_id === 'pwyl_free' ? 'pwyl' :
     subscription?.polar_product_id?.includes('pwyl') ? 'pwyl' : 'fixed');
  
  const pwylAmount = subscription?.metadata?.pwyl_amount
    ? parseFloat(subscription.metadata.pwyl_amount)
    : subscription?.polar_product_id === 'pwyl_free' ? 0 : null;
  
  const isPWYL = pricingMode === 'pwyl';
  const isFree = pwylAmount === 0;
  const currency = 'GBP'; // Default to GBP as we don't have household context here; formatCurrency will use this as fallback

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
          Subscription
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          {isFoundingMember && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 mb-4">
              <p className="font-heading text-sm uppercase tracking-wider text-primary">Founding Member</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have 6 months of Premium access free until {formatDate(foundingMemberUntil)}.
              </p>
              <p className="text-sm font-medium text-foreground mt-2">
                Your household has unlimited pots and no limits on bills or wants.
              </p>
            </div>
          )}

          {/* Trial: cycles remaining (hide for founding members – they already have Premium) */}
          {!isFoundingMember && trialCyclesCompleted < 2 && !trialEndedAt && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4">
              <p className="font-heading text-sm uppercase tracking-wider text-foreground">Trial</p>
              <p className="text-sm text-muted-foreground mt-1">
                {2 - trialCyclesCompleted} of 2 trial cycles remaining.
              </p>
            </div>
          )}

          {/* Grace period: Day X of 7 */}
          {gracePeriodStart && !effectivePremium && (() => {
            const graceStart = new Date(gracePeriodStart);
            const graceEnd = new Date(graceStart);
            graceEnd.setDate(graceEnd.getDate() + 7);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            graceEnd.setHours(0, 0, 0, 0);
            graceStart.setHours(0, 0, 0, 0);
            const daysSinceGrace = Math.floor((today.getTime() - graceStart.getTime()) / (1000 * 60 * 60 * 24));
            const inGrace = today < graceEnd;
            if (!inGrace) return null;
            return (
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 mb-4" key="grace">
                <p className="font-heading text-sm uppercase tracking-wider text-amber-700 dark:text-amber-400">Grace period</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Day {daysSinceGrace + 1} of 7. Grace ends {formatDate(graceEnd.toISOString())}.
                </p>
                <Link href="/pricing">
                  <Button variant="outline" className="mt-2 px-4 py-2 text-sm">
                    Upgrade to Premium to keep full access
                  </Button>
                </Link>
              </div>
            );
          })()}

          {/* Post-grace on Free */}
          {gracePeriodStart && !effectivePremium && (() => {
            const graceStart = new Date(gracePeriodStart);
            const graceEnd = new Date(graceStart);
            graceEnd.setDate(graceEnd.getDate() + 7);
            const today = new Date();
            if (today >= graceEnd) {
              return (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4" key="post-grace">
                  <p className="font-heading text-sm uppercase tracking-wider text-foreground">Free tier</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You&apos;re now on Free tier with limited pots and bills. Upgrade to Premium for full functionality.
                  </p>
                  <Link href="/pricing">
                    <Button className="mt-2 px-4 py-2 text-sm">
                      Upgrade to Premium
                    </Button>
                  </Link>
                </div>
              );
            }
            return null;
          })()}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <p className="font-heading text-lg uppercase tracking-wide text-foreground">
                {effectivePremium
                  ? isFoundingMember
                    ? 'Premium'
                    : isPWYL && isFree
                      ? 'Premium (Free)'
                      : 'Premium'
                  : 'Free'}
              </p>
              {!isFoundingMember && isPWYL && pwylAmount !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  {isFree
                    ? 'Community Supporter'
                    : `${currencySymbol(currency)}${pwylAmount.toFixed(2)}/month`}
                </p>
              )}
            </div>
            {isFoundingMember ? (
              <Badge variant="default" className="uppercase bg-primary/90 text-primary-foreground">
                Founding Member
              </Badge>
            ) : status ? (
              <Badge variant={getStatusBadgeVariant(status)} className="uppercase">
                {status}
              </Badge>
            ) : null}
          </div>

          {(subscription && isActive) || isFoundingMember ? (
            <>
              {status === 'trialing' && subscription?.trial_end_date && !isFoundingMember && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Trial Ends</p>
                  <p className="text-sm text-foreground">{formatDate(subscription.trial_end_date)}</p>
                </div>
              )}

              {effectivePremium && !isFoundingMember && (
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
                        Thank you for contributing {currencySymbol(currency)}{pwylAmount.toFixed(2)}/month!
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <PortalLink
                          href={PORTAL_URL}
                          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Change Amount
                          <ExternalLink className="h-3 w-3" />
                        </PortalLink>
                        <PortalLink
                          href={PORTAL_URL}
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          Manage subscription (cancel, change amount, update payment)
                          <ExternalLink className="h-3 w-3" />
                        </PortalLink>
                      </div>
                    </div>
                  ) : (
                    <PortalLink
                      href={PORTAL_URL}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Manage subscription (cancel, change amount, update payment)
                      <ExternalLink className="h-3 w-3" />
                    </PortalLink>
                  )}
                </div>
              )}
            </>
          ) : null}

          {!effectivePremium && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to Premium for unlimited pots, bills, and wants.
              </p>
              <Link href="/pricing">
                <Button>View Pricing</Button>
              </Link>
            </div>
          )}

          {status === 'past_due' && !isFoundingMember && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-destructive">
                Your payment is past due. Please update your payment method to continue using Premium features.
              </p>
              <PortalLink
                href={PORTAL_URL}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-6 py-3 font-heading text-cta uppercase tracking-widest text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Update Payment Method
                <ExternalLink className="h-3 w-3" />
              </PortalLink>
            </div>
          )}

          {status === 'cancelled' && !isFoundingMember && (
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
