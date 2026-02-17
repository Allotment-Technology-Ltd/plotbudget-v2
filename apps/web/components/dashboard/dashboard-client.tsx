'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { HeroMetrics } from './hero-metrics';
import { IncomeThisCycle } from './income-this-cycle';
import { QuickActions } from './quick-actions';
import { SavingsProgressCards } from './savings-progress-cards';
import { RepaymentProgressCards } from './repayment-progress-cards';
import { CoupleContributions } from './couple-contributions';
import { UpcomingBills } from './upcoming-bills';
import { RecentActivity } from './recent-activity';
import { SpendingTrends } from './spending-trends';
import { DebtTrendChart } from './debt-trend-chart';
import { FoundingMemberCelebration } from './founding-member-celebration';
import type { Household, PayCycle, Seed, Pot, Repayment } from '@repo/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';

type HistoricalCycle = Pick<
  PayCycle,
  | 'id'
  | 'name'
  | 'start_date'
  | 'end_date'
  | 'total_income'
  | 'total_allocated'
  | 'alloc_needs_me'
  | 'alloc_needs_partner'
  | 'alloc_needs_joint'
  | 'alloc_wants_me'
  | 'alloc_wants_partner'
  | 'alloc_wants_joint'
  | 'alloc_savings_me'
  | 'alloc_savings_partner'
  | 'alloc_savings_joint'
  | 'alloc_repay_me'
  | 'alloc_repay_partner'
  | 'alloc_repay_joint'
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
  ownerLabel?: string;
  partnerLabel?: string;
  userId?: string;
  foundingMemberUntil?: string | null;
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
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
  userId,
  foundingMemberUntil,
}: DashboardClientProps) {
  const otherLabel = isPartner ? ownerLabel : partnerLabel;
  const { setNavigating } = useNavigationProgress();

  const isFoundingMember =
    foundingMemberUntil &&
    userId &&
    new Date(foundingMemberUntil) > new Date();

  if (!currentPaycycle) {
    return (
      <div className="min-h-screen bg-background">
        {isFoundingMember && (
          <FoundingMemberCelebration
            userId={userId}
            foundingMemberUntil={foundingMemberUntil}
          />
        )}
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
            <Link href="/dashboard/blueprint" onClick={() => setNavigating(true)}>
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
      {isFoundingMember && (
        <FoundingMemberCelebration
          userId={userId}
          foundingMemberUntil={foundingMemberUntil}
        />
      )}
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
          currency={household.currency}
          ownerLabel={ownerLabel}
          partnerLabel={partnerLabel}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UpcomingBills seeds={seeds} currency={household.currency} />
          <RecentActivity
            seeds={seeds}
            pots={pots}
            repayments={repayments}
            currency={household.currency}
          />
        </div>

        <QuickActions
          household={household}
          paycycle={currentPaycycle}
          hasDraftCycle={hasDraftCycle}
        />

        <SpendingTrends
          currentCycle={currentPaycycle}
          historicalCycles={historicalCycles}
          household={household}
        />

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {pots.length > 0 ? (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <SavingsProgressCards pots={pots} currency={household.currency} />
                </div>
              ) : (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h2 className="font-heading text-xl uppercase tracking-wider mb-4">Savings goals</h2>
                  <p className="text-muted-foreground text-sm mb-4">No savings goals yet. Add them in Blueprint.</p>
                  <Link href="/dashboard/blueprint" onClick={() => setNavigating(true)} className="text-primary font-heading text-sm uppercase tracking-wider hover:underline">
                    Manage Blueprint
                  </Link>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="space-y-6"
            >
              {repayments.length > 0 ? (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <RepaymentProgressCards repayments={repayments} currency={household.currency} />
                </div>
              ) : (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h2 className="font-heading text-xl uppercase tracking-wider mb-4">Debt progress</h2>
                  <p className="text-muted-foreground text-sm mb-4">No debts yet. Add them in Blueprint.</p>
                  <Link href="/dashboard/blueprint" onClick={() => setNavigating(true)} className="text-primary font-heading text-sm uppercase tracking-wider hover:underline">
                    Manage Blueprint
                  </Link>
                </div>
              )}
              <DebtTrendChart
                currentCycle={currentPaycycle}
                historicalCycles={historicalCycles}
                repayments={repayments}
                seeds={seeds}
                householdConfig={
                  household
                    ? {
                        pay_cycle_type: household.pay_cycle_type,
                        pay_day: household.pay_day,
                        anchor_date: household.pay_cycle_anchor,
                      }
                    : null
                }
                currency={household.currency}
              />
            </motion.div>
          </div>

          {household.is_couple && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <CoupleContributions
                household={household}
                paycycle={currentPaycycle}
                seeds={seeds}
                isPartner={isPartner}
                otherLabel={otherLabel}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
