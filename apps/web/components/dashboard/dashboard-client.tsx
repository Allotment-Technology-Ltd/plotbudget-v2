'use client';

import { useState } from 'react';
import { HeroMetrics } from './hero-metrics';
import { QuickActions } from './quick-actions';
import { FinancialHealthCard } from './financial-health-card';
import { CategoryDonutChart } from './category-donut-chart';
import { SavingsDebtProgress } from './savings-debt-progress';
import { CoupleContributions } from './couple-contributions';
import { UpcomingBills } from './upcoming-bills';
import { RecentActivity } from './recent-activity';
import { SpendingTrends } from './spending-trends';
import type { Household, PayCycle, Seed, Pot, Repayment } from '@/lib/supabase/database.types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type HistoricalCycle = Pick<
  PayCycle,
  'id' | 'name' | 'start_date' | 'end_date' | 'total_income' | 'total_allocated'
>;

export interface DashboardClientProps {
  household: Household;
  currentPaycycle: PayCycle | null;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  historicalCycles: HistoricalCycle[];
  hasDraftCycle: boolean;
}

export function DashboardClient({
  household,
  currentPaycycle,
  seeds,
  pots,
  repayments,
  historicalCycles,
  hasDraftCycle,
}: DashboardClientProps) {
  const [, setSelectedCategory] = useState<string | null>(null);

  if (!currentPaycycle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="content-wrapper py-6">
            <h1 className="font-heading text-headline-sm md:text-headline uppercase">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your financial overview
            </p>
          </div>
        </header>
        <main className="content-wrapper section-padding">
          <div
            className="bg-card rounded-lg border border-border p-12 text-center"
            role="region"
            aria-label="No active pay cycle"
          >
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground mb-2">
              No active pay cycle
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create or activate a pay cycle in Blueprint to see your dashboard.
            </p>
            <Link href="/dashboard/blueprint">
              <Button className="btn-primary">Go to Blueprint</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper py-6">
          <h1 className="font-heading text-headline-sm md:text-headline uppercase">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your financial overview
          </p>
        </div>
      </header>

      <main className="content-wrapper section-padding space-y-8">
        <HeroMetrics
          paycycle={currentPaycycle}
          household={household}
          seeds={seeds}
        />

        <QuickActions
          household={household}
          paycycle={currentPaycycle}
          hasDraftCycle={hasDraftCycle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FinancialHealthCard
              paycycle={currentPaycycle}
              household={household}
              seeds={seeds}
            />

            <SavingsDebtProgress pots={pots} repayments={repayments} />

            {household.is_couple && (
              <CoupleContributions
                household={household}
                paycycle={currentPaycycle}
                seeds={seeds}
              />
            )}
          </div>

          <div className="space-y-6">
            <CategoryDonutChart
              paycycle={currentPaycycle}
              household={household}
              onCategorySelect={setSelectedCategory}
            />

            <UpcomingBills seeds={seeds} />

            <RecentActivity
              seeds={seeds}
              pots={pots}
              repayments={repayments}
            />
          </div>
        </div>

        <SpendingTrends
          currentCycle={currentPaycycle}
          historicalCycles={historicalCycles}
        />
      </main>
    </div>
  );
}
