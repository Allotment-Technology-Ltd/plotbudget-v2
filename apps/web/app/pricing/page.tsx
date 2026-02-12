import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PricingMatrix } from '@/components/pricing/pricing-matrix';
import { PWYLPricingMatrix } from '@/components/pricing/pricing-matrix-pwyl';
import { getPricingEnabledFromEnv, getPWYLPricingEnabledFromEnv, getFixedPricingEnabledFromEnv, getAvatarEnabledFromEnv } from '@/lib/feature-flags';
import { PricingHeaderNavClient } from './pricing-header-nav-client';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'PLOT pricing: start free, unlock more pots when you need them.',
};

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const pricingEnabled = getPricingEnabledFromEnv();
  if (!pricingEnabled) {
    redirect(user ? '/dashboard' : '/login');
  }
  
  const pwylEnabled = getPWYLPricingEnabledFromEnv();
  const fixedEnabled = getFixedPricingEnabledFromEnv();
  const avatarEnabled = getAvatarEnabledFromEnv();
  
  // Default to PWYL if neither flag is explicitly set
  const showPWYL = pwylEnabled || (!pwylEnabled && !fixedEnabled);

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
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
    partnerOf = partnerOfData as PartnerHousehold | null;
    isPartner = !owned && !!partnerOf;
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
                  avatar_url: avatarEnabled ? avatarUrl : null,
                },
                isPartner,
                avatarEnabled,
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

        {showPWYL ? (
          <PWYLPricingMatrix
            isLoggedIn={!!user}
            householdId={user ? (owned?.id ?? partnerOf?.id ?? null) : null}
            userId={user?.id ?? null}
          />
        ) : (
          <PricingMatrix
            pricingEnabled={pricingEnabled}
            isLoggedIn={!!user}
            householdId={user ? (owned?.id ?? partnerOf?.id ?? null) : null}
            userId={user?.id ?? null}
          />
        )}
      </div>
    </div>
  );
}
