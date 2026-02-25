'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/navigation/user-menu';
import { createClient } from '@/lib/supabase/client';

const DashboardNavClient = dynamic(
  () => Promise.resolve(DashboardNav),
  { ssr: false }
);
const UserMenuClient = dynamic(
  () => Promise.resolve(UserMenu),
  { ssr: false }
);

type UserMenuData = {
  user: { id: string; email: string; display_name: string | null; avatar_url: string | null };
  isPartner: boolean;
} | null;

export function PricingHeaderNavClient() {
  const [userMenuProps, setUserMenuProps] = useState<UserMenuData | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setUserMenuProps(null);
        return;
      }
      supabase
        .from('users')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          setUserMenuProps({
            user: {
              id: user.id,
              email: user.email ?? '',
              display_name: (profile as { display_name: string | null } | null)?.display_name ?? null,
              avatar_url: (profile as { avatar_url: string | null } | null)?.avatar_url ?? null,
            },
            isPartner: false,
          });
        });
    });
  }, []);

  // Show login/signup during initial render and when unauthenticated
  if (!userMenuProps) {
    return (
      <>
        <Link
          href="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get started
        </Link>
      </>
    );
  }

  return (
    <>
      <DashboardNavClient />
      <UserMenuClient
        user={userMenuProps.user}
        isPartner={userMenuProps.isPartner}
      />
    </>
  );
}
