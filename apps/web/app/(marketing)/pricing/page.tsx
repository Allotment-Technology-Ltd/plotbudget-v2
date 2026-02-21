import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PricingMatrix } from '@/components/pricing/pricing-matrix';
import { PWYLPricingMatrix } from '@/components/pricing/pricing-matrix-pwyl';
import {
  getPaymentUiVisibleFromServerFlags,
  getFullPremiumVisibleFromServerFlags,
  getPWYLPricingEnabledFromEnv,
  getFixedPricingEnabledFromEnv,
} from '@/lib/feature-flags';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'PLOT pricing: start free, unlock more pots when you need them.',
};

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const flags = await getServerFeatureFlags(user?.id ?? null);
  const paymentUiVisible = getPaymentUiVisibleFromServerFlags(flags);
  if (!paymentUiVisible) {
    redirect(user ? '/dashboard' : '/login');
  }

  const fullPremiumVisible = getFullPremiumVisibleFromServerFlags(flags);
  const pwylEnabled = getPWYLPricingEnabledFromEnv();
  const fixedEnabled = getFixedPricingEnabledFromEnv();
  const showPWYL = !fullPremiumVisible || pwylEnabled || (!pwylEnabled && !fixedEnabled);

  let foundingMemberUntil: string | null = null;
  if (user) {
    const { data: ownedData } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    const { data: partnerOfData } = await supabase
      .from('households')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle();
    const householdId = (ownedData as { id: string } | null)?.id ?? (partnerOfData as { id: string } | null)?.id ?? null;
    if (householdId) {
      try {
        const { data: householdStatus } = await supabase
          .from('households')
          .select('founding_member_until')
          .eq('id', householdId)
          .maybeSingle();
        if (householdStatus) {
          foundingMemberUntil = (householdStatus as Record<string, unknown>).founding_member_until as string | null;
        }
      } catch {
        // column may not exist in test DB
      }
    }
  }

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

      {user && foundingMemberUntil && (() => {
        const end = new Date(foundingMemberUntil);
        if (end > new Date()) {
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
          if (end > oneMonthFromNow) {
            const founderDate = end.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
            return (
              <div className="mb-12 rounded-lg border border-primary/30 bg-primary/5 px-6 py-4 text-center">
                <p className="font-heading text-sm uppercase tracking-wider text-primary mb-2">
                  Founding Member
                </p>
                <p className="text-sm text-muted-foreground">
                  You have 12 months of Premium access free until {founderDate}. Thanks for being here from the start — your support for PLOT means everything.
                </p>
              </div>
            );
          }
        }
        return null;
      })()}

      {showPWYL ? (
        <PWYLPricingMatrix isLoggedIn={!!user} />
      ) : (
        <PricingMatrix
          pricingEnabled={fullPremiumVisible}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}
