'use client';

import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/currency';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

interface HeroMetricsProps {
  paycycle: PayCycle;
  household: Household;
  seeds: Seed[];
}

const typeMap = {
  need: 'needs',
  want: 'wants',
  savings: 'savings',
  repay: 'repay',
} as const;

/**
 * Total remaining budget from seeds (unpaid amounts). Use this for display so
 * the dashboard is correct even when paycycle.rem_* are out of sync.
 */
function getTotalRemainingFromSeeds(seeds: Seed[]): number {
  const rem: Record<string, number> = {
    rem_needs_me: 0,
    rem_needs_partner: 0,
    rem_needs_joint: 0,
    rem_wants_me: 0,
    rem_wants_partner: 0,
    rem_wants_joint: 0,
    rem_savings_me: 0,
    rem_savings_partner: 0,
    rem_savings_joint: 0,
    rem_repay_me: 0,
    rem_repay_partner: 0,
    rem_repay_joint: 0,
  };
  for (const seed of seeds) {
    const typeKey = typeMap[seed.type];
    if (seed.payment_source === 'me') {
      const k = `rem_${typeKey}_me` as keyof typeof rem;
      rem[k] += seed.is_paid ? 0 : Number(seed.amount);
    } else if (seed.payment_source === 'partner') {
      const k = `rem_${typeKey}_partner` as keyof typeof rem;
      rem[k] += seed.is_paid ? 0 : Number(seed.amount);
    } else {
      const unpaidMe = seed.is_paid_me ? 0 : Number(seed.amount_me ?? 0);
      const unpaidPartner = seed.is_paid_partner ? 0 : Number(seed.amount_partner ?? 0);
      const k = `rem_${typeKey}_joint` as keyof typeof rem;
      rem[k] += unpaidMe + unpaidPartner;
    }
  }
  return Object.values(rem).reduce((a, b) => a + b, 0);
}

/** Fallback: total remaining from paycycle.rem_* (may be stale). */
function getTotalRemainingFromPaycycle(paycycle: PayCycle): number {
  return (
    paycycle.rem_needs_me +
    paycycle.rem_needs_partner +
    paycycle.rem_needs_joint +
    paycycle.rem_wants_me +
    paycycle.rem_wants_partner +
    paycycle.rem_wants_joint +
    paycycle.rem_savings_me +
    paycycle.rem_savings_partner +
    paycycle.rem_savings_joint +
    paycycle.rem_repay_me +
    paycycle.rem_repay_partner +
    paycycle.rem_repay_joint
  );
}

type StatusKey = 'good' | 'warning' | 'danger' | 'neutral';

export function HeroMetrics({ paycycle, household, seeds }: HeroMetricsProps) {
  const currency = household?.currency ?? 'GBP';
  const totalRemaining =
    seeds.length > 0
      ? getTotalRemainingFromSeeds(seeds)
      : getTotalRemainingFromPaycycle(paycycle);
  const allocatedPercent =
    paycycle.total_income > 0
      ? (paycycle.total_allocated / paycycle.total_income) * 100
      : 0;
  const remainingPercent =
    paycycle.total_income > 0
      ? (totalRemaining / paycycle.total_income) * 100
      : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(paycycle.start_date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(paycycle.end_date);
  endDate.setHours(0, 0, 0, 0);

  const daysElapsed = Math.max(0, differenceInDays(today, startDate));
  const totalDays = Math.max(1, differenceInDays(endDate, startDate));
  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const cycleNotStarted = today < startDate;
  const daysUntilStart = cycleNotStarted ? Math.max(0, differenceInDays(startDate, today)) : 0;
  const cycleProgress = (daysElapsed / totalDays) * 100;

  const metrics = [
    {
      label: 'Allocated',
      value: formatCurrency(paycycle.total_allocated, currency),
      subtext: `of ${formatCurrency(paycycle.total_income, currency)}`,
      percentage: allocatedPercent,
      status: (allocatedPercent > 100
        ? 'danger'
        : allocatedPercent > 90
          ? 'warning'
          : 'good') as StatusKey,
    },
    {
      label: 'Left to spend',
      value: formatCurrency(totalRemaining, currency),
      subtext: `${remainingPercent.toFixed(0)}% of income left this cycle`,
      percentage: remainingPercent,
      status: (remainingPercent < 10 ? 'warning' : 'good') as StatusKey,
    },
    {
      label: 'Days Left',
      value: cycleNotStarted
        ? `Starts in ${daysUntilStart} days`
        : `${daysRemaining} days`,
      subtext: cycleNotStarted
        ? `Pay day: ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : `${cycleProgress.toFixed(0)}% through`,
      percentage: cycleProgress,
      status: 'neutral' as StatusKey,
    },
  ];

  const statusColors: Record<StatusKey, string> = {
    good: 'text-primary',
    warning: 'text-warning',
    danger: 'text-destructive',
    neutral: 'text-foreground',
  };

  return (
    <section
      className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      aria-label="Current cycle overview"
      data-testid="dashboard-hero"
    >
      {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-card rounded-lg p-6 border border-border hover:border-primary/30 transition-colors duration-200 min-w-0 overflow-hidden"
            role="article"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </p>
            </div>
            <p
              className={`text-2xl sm:text-3xl font-display mb-1 break-all ${statusColors[metric.status]}`}
            >
              {metric.value}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {metric.subtext}
            </p>
            {metric.percentage !== null && (
              <div
                className="h-2 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.min(metric.percentage, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${metric.label} progress`}
              >
                <motion.div
                  className={`h-full transition-all ${
                    metric.status === 'danger'
                      ? 'bg-destructive'
                      : metric.status === 'warning'
                        ? 'bg-warning'
                        : 'bg-primary'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            )}
          </motion.div>
      ))}
    </section>
  );
}
