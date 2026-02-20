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
  let owned: { id: string } | null = null;
  let partnerOf: { id: string; partner_name: string | null } | null = null;

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
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    owned = ownedData as { id: string } | null;

    const { data: partnerOfData } = await supabase
      .from('households')
      .select('id, partner_name')
      .eq('partner_user_id', user.id)
      .maybeSingle();
    type PartnerHousehold = { id: string; partner_name: string | null };
    partnerOf = partnerOfData as unknown as PartnerHousehold | null;
    
    isPartner = !owned && !!partnerOf;
    
    // Fetch founding member status separately - graceful fallback if column doesn't exist yet
    try {
      const householdId = owned?.id ?? partnerOf?.id;
      if (householdId) {
        const { data: householdStatus } = await supabase
          .from('households')
          .select('founding_member_until')
          .eq('id', householdId)
          .maybeSingle();
        
        if (householdStatus) {
          foundingMemberUntil = (householdStatus as Record<string, unknown>).founding_member_until as string | null;
        }
      }
    } catch {
      // Silently fail - column may not exist yet in test DB
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
            className="font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
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
                    You have 12 months of Premium access free until {founderDate}. Thanks for being here from the start — your support for PLOT means everything.
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