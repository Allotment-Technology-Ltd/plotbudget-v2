'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { HeroMetrics } from './hero-metrics';
import { IncomeThisCycle } from './income-this-cycle';
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

export type IncomeEventDisplay = {
  sourceName: string;
  amount: number;
  date: string;
  payment_source: 'me' | 'partner' | 'joint';
};

export interface DashboardClientProps {
  household: Household;
  currentPaycycle: PayCycle | null;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  historicalCycles: HistoricalCycle[];
  hasDraftCycle: boolean;
  incomeEvents?: IncomeEventDisplay[];
  isPartner?: boolean;
  ownerDisplayName?: string | null;
}

export function DashboardClient({
  household,
  currentPaycycle,
  seeds,
  pots,
  repayments,
  historicalCycles,
  hasDraftCycle,
  incomeEvents = [],
  isPartner = false,
  ownerDisplayName = null,
}: DashboardClientProps) {
  const otherLabel = isPartner
    ? (ownerDisplayName?.trim() || 'Account owner')
    : (household.partner_name?.trim() || 'Partner');
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
            data-testid="dashboard-no-cycle"
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

  const paycycleStart = format(new Date(currentPaycycle.start_date), 'MMM d');
  const paycycleEnd = format(new Date(currentPaycycle.end_date), 'MMM d, yyyy');

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper py-6">
          <h1 className="font-heading text-headline-sm md:text-headline uppercase">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Your financial overview</span>
            <span
              className="flex items-center gap-1"
              aria-label="Current pay cycle dates"
            >
              <Calendar className="w-4 h-4 shrink-0" aria-hidden />
              {paycycleStart} – {paycycleEnd}
            </span>
          </p>
        </div>
      </header>

      <main className="content-wrapper section-padding space-y-8">
        <HeroMetrics
          paycycle={currentPaycycle}
          household={household}
          seeds={seeds}
        />

        <IncomeThisCycle
          total={currentPaycycle.total_income}
          events={incomeEvents}
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
                isPartner={isPartner}
                otherLabel={otherLabel}
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
