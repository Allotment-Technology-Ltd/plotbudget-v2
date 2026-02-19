'use client';

import dynamic from 'next/dynamic';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserMenu } from '@/components/navigation/user-menu';
import { AppFooter } from '@/components/navigation/app-footer';

// Mount nav, user menu, and footer only on client so usePathname/useTheme context is available (avoids "useContext null" Server Error in some envs)
const DashboardNavClient = dynamic(
  () => Promise.resolve(DashboardNav),
  { ssr: false }
);
const UserMenuClient = dynamic(
  () => Promise.resolve(UserMenu),
  { ssr: false }
);
const AppFooterClient = dynamic(
  () => Promise.resolve(AppFooter),
  { ssr: false }
);

export type DashboardHeaderNavClientProps = {
  userMenuProps: {
    user: { id: string; email: string; display_name: string | null; avatar_url: string | null };
    isPartner: boolean;
    trialTestingDashboardVisible?: boolean;
    isAdmin?: boolean;
  };
};

export function DashboardHeaderNavClient({ userMenuProps }: DashboardHeaderNavClientProps) {
  return (
    <nav className="flex items-center gap-6">
      <DashboardNavClient />
      <UserMenuClient
        user={userMenuProps.user}
        isPartner={userMenuProps.isPartner}
        trialTestingDashboardVisible={userMenuProps.trialTestingDashboardVisible}
        isAdmin={userMenuProps.isAdmin}
      />
    </nav>
  );
}

export function DashboardFooterClient() {
  return <AppFooterClient />;
}
