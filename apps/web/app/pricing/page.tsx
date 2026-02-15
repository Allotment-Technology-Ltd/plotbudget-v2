import type { Metadata } from 'next';
import Link from 'next/link';
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
import { PricingHeaderNavClient } from './pricing-header-nav-client';

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
  // When full premium is off, show PWYL only; otherwise PWYL vs fixed per env
  const showPWYL = !fullPremiumVisible || pwylEnabled || (!pwylEnabled && !fixedEnabled);

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let foundingMemberUntil: string | null = null;
  let isPartner = false;
  let owned: { id: string; founding_member_until: string | null } | null = null;
  let partnerOf: { id: string; partner_name: string | null; founding_member_until: string | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    type ProfileRow = { display_name: string | null; avatar_url: string | null };
    const profileRow = profile as ProfileRow | null;
    displayName = profileRow?.display_name ?? null;
    avatarUrl = profileRow?.avatar_url ?? null;

    const { data: ownedData } = await supabase
      .from('households')
      .select('id, founding_member_until')
      .eq('owner_id', user.id)
      .maybeSingle();
    owned = ownedData as { id: string; founding_member_until: string | null } | null;

    const { data: partnerOfData } = await supabase
      .from('households')
      .select('id, partner_name, founding_member_until')
      .eq('partner_user_id', user.id)
      .maybeSingle();
    type PartnerHousehold = { id: string; partner_name: string | null; founding_member_until: string | null };
    partnerOf = partnerOfData as PartnerHousehold | null;
    isPartner = !owned && !!partnerOf;
    
    if (owned?.founding_member_until) {
      foundingMemberUntil = owned.founding_member_until;
    } else if (partnerOf?.founding_member_until) {
      foundingMemberUntil = partnerOf.founding_member_until;
    } else {
      // Fallback for transition period if household not yet backfilled/created?
      // Or just prefer household. If household is null, user hasn't created one, so maybe check profile?
      // If user is new, household trigger will set it on household.
      // If user is existing and backfill ran, household has it.
      // If user has not created household yet, they can't be a founder via household count?
      // Wait, trigger is on household creation.
      // So if I am a user without a household, I am not a founder yet?
      // But the "Founding Member" status was previously on signup.
      // If we move to household creation, then yes, you become a founder when you create a household.
      // So checking household is correct.
      // But we should probably check profile as fallback if migration hasn't run or something?
      // No, let's stick to the new source of truth to avoid confusion.
      // But wait, if I am a user and I haven't created a household yet, do I see the message?
      // Before: Yes.
      // Now: No.
      // Is that okay? "First 50 households". If you haven't created one, you aren't one of the 50 yet.
      // That seems consistent with "limit to 50 households".
      // But if I signed up and am "User 49", and I wait to create a household... and 50 others create households...
      // Then I create mine as #51. Do I lose it?
      // Yes, if the limit is 50 households.
      // That seems fair.
    }
    
    if (isPartner && partnerOf) {
      displayName = (partnerOf.partner_name ?? displayName ?? 'Partner').trim() || 'Partner';
    }
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
          <nav className="flex items-center gap-6">
            <PricingHeaderNavClient
              userMenuProps={user ? {
                user: {
                  id: user.id,
                  email: user.email ?? '',
                  display_name: displayName,
                  avatar_url: avatarUrl,
                },
                isPartner,
              } : null}
            />
          </nav>
        </div>
      </header>

      <div className="content-wrapper py-12 md:py-16">
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
                    You have 6 months of Premium access free until {founderDate}. Thanks for being here from the start — your support for PLOT means everything.
                  </p>
                </div>
              );
            }
          }
          return null;
        })()}

        {showPWYL ? (
          <PWYLPricingMatrix
            isLoggedIn={!!user}
          />
        ) : (
          <PricingMatrix
            pricingEnabled={fullPremiumVisible}
            isLoggedIn={!!user}
          />
        )}
      </div>
    </div>
  );
}