'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HeroMetrics } from './hero-metrics';
import { IncomeThisCycle } from './income-this-cycle';
import { CoupleContributions } from './couple-contributions';
import { UpcomingBills } from './upcoming-bills';
import { RecentActivity } from './recent-activity';
import { SpendingTrends } from './spending-trends';
import { DebtTrendChart } from './debt-trend-chart';
import { FoundingMemberCelebration } from './founding-member-celebration';
import { DashboardHeader } from './dashboard-header';
import { DashboardNoCycleView } from './dashboard-no-cycle-view';
import { DashboardSavingsSection } from './dashboard-savings-section';
import { DashboardRepaymentSection } from './dashboard-repayment-section';
import { useIsFoundingMember } from './use-dashboard-state';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { Button } from '@/components/ui/button';
import type { DashboardClientProps, HistoricalCycle, IncomeEventDisplay } from './dashboard-types';
import type { Household, PayCycle, Seed, Pot, Repayment } from '@repo/supabase';

export type { DashboardClientProps, IncomeEventDisplay } from './dashboard-types';

interface DashboardSavingsAndTrendsProps {
  household: Household;
  currentPaycycle: PayCycle;
  historicalCycles: HistoricalCycle[];
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  reducedMotion: boolean;
}

function DashboardSavingsAndTrends({
  household,
  currentPaycycle,
  historicalCycles,
  seeds,
  pots,
  repayments,
  reducedMotion,
}: DashboardSavingsAndTrendsProps) {
  const motionTransition = { duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : 0.1 };
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardSavingsSection pots={pots} currency={household.currency} />
        <DashboardRepaymentSection repayments={repayments} currency={household.currency} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionTransition}
        className="w-full"
      >
        <DebtTrendChart
          currentCycle={currentPaycycle}
          historicalCycles={historicalCycles}
          repayments={repayments}
          seeds={seeds}
          householdConfig={{
            pay_cycle_type: household.pay_cycle_type,
            pay_day: household.pay_day,
            anchor_date: household.pay_cycle_anchor,
          }}
          currency={household.currency}
        />
      </motion.div>
    </div>
  );
}

interface DashboardMainContentProps {
  household: Household;
  currentPaycycle: PayCycle;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  historicalCycles: HistoricalCycle[];
  incomeEvents: IncomeEventDisplay[];
  isPartner: boolean;
  otherLabel: string;
  ownerLabel: string;
  partnerLabel: string;
  reducedMotion: boolean;
}

/** Calm Design Rules 1 & 6: Default view shows ≤5 key data points; rest behind progressive disclosure. */
function DashboardMainContent({
  household,
  currentPaycycle,
  seeds,
  pots,
  repayments,
  historicalCycles,
  incomeEvents,
  isPartner,
  otherLabel,
  ownerLabel,
  partnerLabel,
  reducedMotion,
}: DashboardMainContentProps) {
  const [showMore, setShowMore] = useState(false);
  const motionTransition = { duration: reducedMotion ? 0 : 0.4 };

  return (
    <main className="content-wrapper section-padding space-y-8">
      <HeroMetrics paycycle={currentPaycycle} household={household} seeds={seeds} />
      <IncomeThisCycle
        total={currentPaycycle.total_income}
        events={incomeEvents}
        currency={household.currency}
        ownerLabel={ownerLabel}
        partnerLabel={partnerLabel}
      />
      <UpcomingBills seeds={seeds} currency={household.currency} />

      {!showMore ? (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMore(true)}
            className="gap-2"
            aria-expanded="false"
            aria-controls="dashboard-more-section"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
            Activity, savings & trends
          </Button>
        </div>
      ) : (
        <div id="dashboard-more-section" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity
              seeds={seeds}
              pots={pots}
              repayments={repayments}
              currency={household.currency}
            />
          </div>
          {household.is_couple && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={motionTransition}
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
          <SpendingTrends
            currentCycle={currentPaycycle}
            historicalCycles={historicalCycles}
            household={household}
          />
          <DashboardSavingsAndTrends
            household={household}
            currentPaycycle={currentPaycycle}
            historicalCycles={historicalCycles}
            seeds={seeds}
            pots={pots}
            repayments={repayments}
            reducedMotion={reducedMotion}
          />
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowMore(false)}
              className="gap-2 text-muted-foreground"
              aria-expanded="true"
              aria-controls="dashboard-more-section"
            >
              <ChevronUp className="h-4 w-4" aria-hidden />
              Show less
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

export function DashboardClient({
  household,
  currentPaycycle,
  seeds,
  pots,
  repayments,
  historicalCycles,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use
  hasDraftCycle: _hasDraftCycle,
  incomeEvents = [],
  isPartner = false,
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
  userId,
  foundingMemberUntil,
}: DashboardClientProps) {
  const otherLabel = isPartner ? ownerLabel : partnerLabel;
  const isFoundingMember = useIsFoundingMember(foundingMemberUntil, userId);
  const reducedMotion = useReducedMotion();

  if (!currentPaycycle) {
    return (
      <DashboardNoCycleView
        userId={userId}
        foundingMemberUntil={foundingMemberUntil}
        isFoundingMember={isFoundingMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-page">
      {isFoundingMember && userId && foundingMemberUntil && (
        <FoundingMemberCelebration
          userId={userId}
          foundingMemberUntil={foundingMemberUntil}
        />
      )}
      <DashboardHeader paycycle={currentPaycycle} showDateRange />
      <DashboardMainContent
        household={household}
        currentPaycycle={currentPaycycle}
        seeds={seeds}
        pots={pots}
        repayments={repayments}
        historicalCycles={historicalCycles}
        incomeEvents={incomeEvents}
        isPartner={isPartner}
        otherLabel={otherLabel}
        ownerLabel={ownerLabel}
        partnerLabel={partnerLabel}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
