import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPartnerContext } from '@/lib/partner-context';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/navigation/user-menu';

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

  let displayName: string | null = null;
  let email = '';
  let isPartner = false;

  if (user) {
    email = user.email ?? '';
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    type ProfileRow = { display_name: string | null };
    displayName = (profile as ProfileRow | null)?.display_name ?? null;
  } else {
    const { householdId, isPartner: partner } = await getPartnerContext();
    if (partner && householdId) {
      const admin = createAdminClient();
      const { data: household } = await admin
        .from('households')
        .select('partner_email, partner_name')
        .eq('id', householdId)
        .single();
      if (household) {
        isPartner = true;
        email = (household.partner_email ?? 'Partner').trim() || 'Partner';
        displayName = (household.partner_name ?? 'Partner').trim() || 'Partner';
      }
    }
    if (!isPartner) redirect('/login');
  }

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
                email,
                display_name: displayName,
              }}
              isPartner={isPartner}
            />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
