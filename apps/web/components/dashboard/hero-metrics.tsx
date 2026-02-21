'use client';

import { motion } from 'framer-motion';
import {
  formatCurrency,
  getDashboardCycleMetrics,
} from '@repo/logic';
import type { Household, PayCycle, Seed } from '@repo/supabase';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface HeroMetricsProps {
  paycycle: PayCycle;
  household: Household;
  seeds: Seed[];
}

type StatusKey = 'good' | 'warning' | 'danger' | 'neutral';

export function HeroMetrics({ paycycle, household, seeds }: HeroMetricsProps) {
  const currency = household?.currency ?? 'GBP';
  const reducedMotion = useReducedMotion();
  const cycleMetrics = getDashboardCycleMetrics(paycycle, seeds);
  const {
    totalRemaining,
    allocatedPercent,
    remainingPercent,
    daysRemaining,
    cycleNotStarted,
    daysUntilStart,
    cycleProgress,
  } = cycleMetrics;

  const startDate = new Date(paycycle.start_date);

  const daysMetricLabel = cycleNotStarted ? 'Starts in' : 'Days Left';
  const daysMetricValue = cycleNotStarted
    ? `${daysUntilStart} days`
    : `${daysRemaining} days`;
  const daysMetricSubtext = cycleNotStarted
    ? `Pay day: ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : `${cycleProgress.toFixed(0)}% through`;

  // Calm Design Rule 6: Use warning for over-allocated (planning state), not red/danger.
  let allocatedStatus: StatusKey = 'good';
  if (allocatedPercent > 90) allocatedStatus = 'warning';

  const metrics = [
    {
      label: 'Allocated',
      value: formatCurrency(paycycle.total_allocated, currency),
      subtext: `of ${formatCurrency(paycycle.total_income, currency)}`,
      percentage: allocatedPercent,
      status: allocatedStatus,
    },
    {
      label: 'Left to pay',
      value: formatCurrency(totalRemaining, currency),
      subtext: `${remainingPercent.toFixed(0)}% of income left this cycle`,
      percentage: remainingPercent,
      status: (remainingPercent < 10 ? 'warning' : 'good') as StatusKey,
    },
    {
      label: daysMetricLabel,
      value: daysMetricValue,
      subtext: daysMetricSubtext,
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-label="Current cycle overview"
      data-testid="dashboard-hero"
    >
      {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : index * 0.05 }}
            className="bg-card rounded-lg p-6 border border-border min-w-0 overflow-hidden"
            role="article"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </p>
            </div>
            <p
              className={`text-2xl sm:text-3xl font-display mb-1 break-words ${statusColors[metric.status]}`}
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
                    metric.status === 'warning' ? 'bg-warning' : 'bg-primary'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(metric.percentage, 100)}%` }}
                  transition={{ duration: reducedMotion ? 0 : 0.5, delay: reducedMotion ? 0 : 0.2 }}
                />
              </div>
            )}
          </motion.div>
      ))}
    </section>
  );
}
