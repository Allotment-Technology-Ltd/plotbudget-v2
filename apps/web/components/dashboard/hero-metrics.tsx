'use client';

import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

interface HeroMetricsProps {
  paycycle: PayCycle;
  household: Household;
  seeds: Seed[];
}

/**
 * Total remaining budget across all category/source buckets.
 */
function getTotalRemaining(paycycle: PayCycle): number {
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

export function HeroMetrics({ paycycle }: HeroMetricsProps) {
  const totalRemaining = getTotalRemaining(paycycle);
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
  const cycleProgress = (daysElapsed / totalDays) * 100;

  const metrics = [
    {
      label: 'Allocated',
      value: `£${paycycle.total_allocated.toFixed(2)}`,
      subtext: `of £${paycycle.total_income.toFixed(2)}`,
      percentage: allocatedPercent,
      status: (allocatedPercent > 100
        ? 'danger'
        : allocatedPercent > 90
          ? 'warning'
          : 'good') as StatusKey,
    },
    {
      label: 'Remaining',
      value: `£${totalRemaining.toFixed(2)}`,
      subtext: `${remainingPercent.toFixed(0)}% left`,
      percentage: remainingPercent,
      status: (remainingPercent < 10 ? 'warning' : 'good') as StatusKey,
    },
    {
      label: 'Days Left',
      value: `${daysRemaining} days`,
      subtext: `${cycleProgress.toFixed(0)}% through`,
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
    >
      {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-card rounded-lg p-6 border border-border hover:border-primary/30 transition-colors"
            role="article"
            aria-label={`${metric.label}: ${metric.value}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </p>
            </div>
            <p
              className={`text-3xl font-display mb-1 ${statusColors[metric.status]}`}
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
