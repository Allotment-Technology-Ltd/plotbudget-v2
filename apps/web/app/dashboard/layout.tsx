import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAvatarEnabledFromEnv } from '@/lib/feature-flags';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/navigation/user-menu';
import { AppFooter } from '@/components/navigation/app-footer';

// Mount nav and user menu only on client so usePathname/useTheme context is available (avoids "useContext null" Server Error in some envs)
const DashboardNavClient = dynamic(
  () => Promise.resolve(DashboardNav),
  { ssr: false }
);
const UserMenuClient = dynamic(
  () => Promise.resolve(UserMenu),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your PLOT dashboard',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const email = user.email ?? '';
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  type ProfileRow = { display_name: string | null; avatar_url: string | null };
  const profileRow = profile as ProfileRow | null;
  let displayName = profileRow?.display_name ?? null;
  const avatarUrl = profileRow?.avatar_url ?? null;

  const { data: owned } = await supabase
    .from('households')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: partnerOfData } = await supabase
    .from('households')
    .select('id, partner_name')
    .eq('partner_user_id', user.id)
    .maybeSingle();
  type PartnerHousehold = { id: string; partner_name: string | null };
  const partnerOf = partnerOfData as PartnerHousehold | null;

  const isPartner = !owned && !!partnerOf;
  if (isPartner && partnerOf) {
    displayName = (partnerOf.partner_name ?? displayName ?? 'Partner').trim() || 'Partner';
  }

  const avatarEnabled = getAvatarEnabledFromEnv();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            PLOT
          </Link>
          <nav className="flex items-center gap-6">
            <DashboardNavClient />
            <UserMenuClient
              user={{
                id: user.id,
                email,
                display_name: displayName,
                avatar_url: avatarEnabled ? avatarUrl : null,
              }}
              isPartner={isPartner}
              avatarEnabled={avatarEnabled}
            />
          </nav>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <div className="flex-1">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}
