'use client';

import { motion } from 'framer-motion';
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
import type { DashboardClientProps } from './dashboard-types';

export type { DashboardClientProps, IncomeEventDisplay } from './dashboard-types';

export function DashboardClient({
  household,
  currentPaycycle,
  seeds,
  pots,
  repayments,
  historicalCycles,
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

        {household.is_couple && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardSavingsSection
              pots={pots}
              currency={household.currency}
            />
            <DashboardRepaymentSection
              repayments={repayments}
              currency={household.currency}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full"
          >
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
      </main>
    </div>
  );
}
