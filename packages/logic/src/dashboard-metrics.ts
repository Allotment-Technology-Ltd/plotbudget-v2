/**
 * Shared dashboard metrics logic.
 * Ensures web and native dashboards show identical data for the same user.
 */

import { differenceInDays } from 'date-fns';

/** Minimal Seed shape for total-remaining calculation (matches @repo/supabase) */
export interface SeedForMetrics {
  type: 'need' | 'want' | 'savings' | 'repay';
  payment_source: 'me' | 'partner' | 'joint';
  amount: number;
  amount_me?: number;
  amount_partner?: number;
  is_paid: boolean;
  is_paid_me?: boolean;
  is_paid_partner?: boolean;
}

/** Minimal PayCycle shape for metrics (matches @repo/supabase) */
export interface PayCycleForMetrics {
  start_date: string;
  end_date: string;
  total_income: number;
  total_allocated: number;
  rem_needs_me: number;
  rem_needs_partner: number;
  rem_needs_joint: number;
  rem_wants_me: number;
  rem_wants_partner: number;
  rem_wants_joint: number;
  rem_savings_me: number;
  rem_savings_partner: number;
  rem_savings_joint: number;
  rem_repay_me: number;
  rem_repay_partner: number;
  rem_repay_joint: number;
}

const typeMap = {
  need: 'needs',
  want: 'wants',
  savings: 'savings',
  repay: 'repay',
} as const;

/**
 * Total remaining budget from seeds (unpaid amounts).
 * Use this for display so the dashboard is correct even when paycycle.rem_* are out of sync.
 * Matches web hero-metrics logic exactly.
 */
export function getTotalRemainingFromSeeds(seeds: SeedForMetrics[]): number {
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
export function getTotalRemainingFromPaycycle(paycycle: PayCycleForMetrics): number {
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

export interface DashboardCycleMetrics {
  totalRemaining: number;
  allocatedPercent: number;
  remainingPercent: number;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  cycleNotStarted: boolean;
  daysUntilStart: number;
  cycleProgress: number;
}

/**
 * Compute dashboard cycle metrics (days remaining, totals, percentages).
 * Matches web hero-metrics logic exactly.
 */
export function getDashboardCycleMetrics(
  paycycle: PayCycleForMetrics,
  seeds: SeedForMetrics[]
): DashboardCycleMetrics {
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

  return {
    totalRemaining,
    allocatedPercent,
    remainingPercent,
    daysElapsed,
    totalDays,
    daysRemaining,
    cycleNotStarted,
    daysUntilStart,
    cycleProgress,
  };
}
