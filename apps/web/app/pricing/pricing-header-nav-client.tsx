'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/navigation/user-menu';

const DashboardNavClient = dynamic(
  () => Promise.resolve(DashboardNav),
  { ssr: false }
);
const UserMenuClient = dynamic(
  () => Promise.resolve(UserMenu),
  { ssr: false }
);

export type PricingHeaderNavClientProps = {
  userMenuProps: {
    user: { id: string; email: string; display_name: string | null; avatar_url: string | null };
    isPartner: boolean;
    avatarEnabled: boolean;
  } | null;
};

export function PricingHeaderNavClient({ userMenuProps }: PricingHeaderNavClientProps) {
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
        avatarEnabled={userMenuProps.avatarEnabled}
      />
    </>
  );
}
