import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PricingHeaderNavClient } from '@/app/pricing/pricing-header-nav-client';

/**
 * Shared layout for all public marketing pages (e.g. /roadmap, /pricing).
 * Single header: PLOT logo + nav; main content uses content-wrapper / section-padding for consistency.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    const profileRow = profile as { display_name: string | null; avatar_url: string | null } | null;
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
    partnerOf = partnerOfData as { id: string; partner_name: string | null } | null;
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
            className="flex items-center gap-2.5 font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label="PLOT"
          >
            <Image
              src="/favicon-light.svg"
              alt=""
              width={28}
              height={28}
              className="dark:hidden shrink-0"
            />
            <Image
              src="/favicon-dark.svg"
              alt=""
              width={28}
              height={28}
              className="hidden dark:block shrink-0"
            />
            <span>PLOT</span>
          </Link>
          <nav className="flex items-center gap-6" aria-label="Main navigation">
            <PricingHeaderNavClient
              userMenuProps={
                user
                  ? {
                      user: {
                        id: user.id,
                        email: user.email ?? '',
                        display_name: displayName,
                        avatar_url: avatarUrl,
                      },
                      isPartner,
                    }
                  : null
              }
            />
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
