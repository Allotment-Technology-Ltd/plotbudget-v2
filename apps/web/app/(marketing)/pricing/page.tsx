import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  getPaymentUiVisibleFromServerFlags,
  getFullPremiumVisibleFromServerFlags,
  getPWYLPricingEnabledFromEnv,
  getFixedPricingEnabledFromEnv,
} from '@/lib/feature-flags';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';
import { FoundingMemberBannerClient } from './founding-member-banner-client';
import { PricingContentClient } from './pricing-content-client';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'PLOT pricing: start free, unlock more pots when you need them.',
};

export default async function PricingPage() {
  const flags = await getServerFeatureFlags(null);
  const paymentUiVisible = getPaymentUiVisibleFromServerFlags(flags);
  if (!paymentUiVisible) {
    redirect('/login');
  }

  const fullPremiumVisible = getFullPremiumVisibleFromServerFlags(flags);
  const pwylEnabled = getPWYLPricingEnabledFromEnv();
  const fixedEnabled = getFixedPricingEnabledFromEnv();
  const showPWYL = !fullPremiumVisible || pwylEnabled || (!pwylEnabled && !fixedEnabled);

  return (
    <div className="content-wrapper section-padding">
      <div className="mx-auto max-w-4xl text-center mb-12">
        <h1 className="font-heading text-headline md:text-headline-lg uppercase tracking-wider text-foreground mb-4">
          Simple, honest pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with a free trial. Keep what works for you. Upgrade when you want more pots and no limits.
        </p>
      </div>

      <FoundingMemberBannerClient />

      <PricingContentClient showPWYL={showPWYL} fullPremiumVisible={fullPremiumVisible} />
    </div>
  );
}
