'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';
import { FoundingMemberCelebration } from './founding-member-celebration';
import { DashboardHeader } from './dashboard-header';

interface DashboardNoCycleViewProps {
  userId?: string;
  foundingMemberUntil?: string | null;
  isFoundingMember: boolean;
}

export function DashboardNoCycleView({
  userId,
  foundingMemberUntil,
  isFoundingMember,
}: DashboardNoCycleViewProps) {
  const { setNavigating } = useNavigationProgress();

  return (
    <div className="min-h-screen bg-background">
      {isFoundingMember && userId && foundingMemberUntil && (
        <FoundingMemberCelebration
          userId={userId}
          foundingMemberUntil={foundingMemberUntil}
        />
      )}
      <DashboardHeader showDateRange={false} />
      <main className="content-wrapper section-padding">
        <div
          className="bg-card rounded-lg border border-border p-12 text-center"
          role="region"
          aria-label="No active pay cycle"
          data-testid="dashboard-no-cycle"
        >
          <h2 className="font-heading text-xl uppercase tracking-wider text-foreground mb-2">
            No active pay cycle
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create or activate a pay cycle in Blueprint to see your dashboard.
          </p>
          <Link href="/dashboard/blueprint" onClick={() => setNavigating(true)}>
            <Button className="btn-primary">Go to Blueprint</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
