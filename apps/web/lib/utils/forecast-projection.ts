/**
 * Forecast projection utilities for savings and repayments.
 * Projects balance over time by pay cycle.
 */

import type { PayCycleType } from './suggested-amount';
import {
  calculateNextCycleDates,
  calculateCycleEndDate,
} from './pay-cycle-dates';

export type PayCycleConfig = {
  payCycleType: PayCycleType;
  payDay?: number;
  anchorDate?: string | null;
};

export interface ProjectionPoint {
  date: string;
  cycleIndex: number;
  balance: number;
  cycleStart: string;
  cycleEnd: string;
}

/**
 * Effective start date for "remaining cycles": use today when cycle start is in the past.
 */
function effectiveStartDate(cycleStartStr: string): string {
  const cycleStart = new Date(cycleStartStr);
  const today = new Date();
  cycleStart.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return cycleStart > today ? iso(cycleStart) : iso(today);
}

/**
 * Get the date range (start, end) for cycle N (0-based) starting from effectiveStart.
 */
function getCycleDateRange(
  effectiveStart: string,
  cycleIndex: number,
  config: PayCycleConfig
): { start: string; end: string } {
  if (cycleIndex === 0) {
    const end = calculateCycleEndDate(
      config.payCycleType,
      effectiveStart,
      config.payDay
    );
    return { start: effectiveStart, end };
  }
  let prevEnd = calculateCycleEndDate(
    config.payCycleType,
    effectiveStart,
    config.payDay
  );
  for (let i = 1; i <= cycleIndex; i++) {
    const next = calculateNextCycleDates(
      prevEnd,
      config.payCycleType,
      config.payDay
    );
    prevEnd = next.end;
    if (i === cycleIndex) {
      return { start: next.start, end: next.end };
    }
  }
  return { start: effectiveStart, end: prevEnd };
}

/**
 * Project savings balance over time. Returns array of { date, balance } per cycle
 * until target is reached or maxCycles exceeded.
 */
export function projectSavingsOverTime(
  currentAmount: number,
  targetAmount: number,
  amountPerCycle: number,
  cycleStartDate: string,
  config: PayCycleConfig,
  maxCycles = 60
): ProjectionPoint[] {
  const start = effectiveStartDate(cycleStartDate);
  const points: ProjectionPoint[] = [];
  let balance = currentAmount;

  if (balance >= targetAmount) {
    const { start: s, end: e } = getCycleDateRange(start, 0, config);
    points.push({
      date: e,
      cycleIndex: 0,
      balance,
      cycleStart: s,
      cycleEnd: e,
    });
    return points;
  }

  if (amountPerCycle <= 0) {
    const { start: s, end: e } = getCycleDateRange(start, 0, config);
    points.push({
      date: e,
      cycleIndex: 0,
      balance,
      cycleStart: s,
      cycleEnd: e,
    });
    return points;
  }

  for (let i = 0; i < maxCycles; i++) {
    const { start: cycleStart, end: cycleEnd } = getCycleDateRange(
      start,
      i,
      config
    );
    points.push({
      date: cycleEnd,
      cycleIndex: i,
      balance: Math.round(balance * 100) / 100,
      cycleStart,
      cycleEnd,
    });
    if (balance >= targetAmount) break;
    balance = Math.min(targetAmount, balance + amountPerCycle);
  }

  return points;
}

/**
 * Project repayment balance over time. Returns array of { date, balance } per cycle
 * until balance is cleared or maxCycles exceeded.
 * When includeInterest is true, applies interest_rate (annual %, converted per cycle) before deducting payment.
 */
export function projectRepaymentOverTime(
  currentBalance: number,
  amountPerCycle: number,
  cycleStartDate: string,
  config: PayCycleConfig,
  options: {
    includeInterest?: boolean;
    interestRateAnnualPercent?: number | null;
    maxCycles?: number;
  } = {}
): ProjectionPoint[] {
  const { includeInterest = false, interestRateAnnualPercent, maxCycles = 60 } = options;
  const start = effectiveStartDate(cycleStartDate);
  const points: ProjectionPoint[] = [];
  let balance = currentBalance;

  if (balance <= 0) {
    const { start: s, end: e } = getCycleDateRange(start, 0, config);
    points.push({
      date: e,
      cycleIndex: 0,
      balance: 0,
      cycleStart: s,
      cycleEnd: e,
    });
    return points;
  }

  if (amountPerCycle <= 0) {
    const { start: s, end: e } = getCycleDateRange(start, 0, config);
    points.push({
      date: e,
      cycleIndex: 0,
      balance,
      cycleStart: s,
      cycleEnd: e,
    });
    return points;
  }

  // For monthly cycles, approximate cycles per year = 12; for 4-weekly = 52/4 ≈ 13
  const cyclesPerYear =
    config.payCycleType === 'every_4_weeks' ? 52 / 4 : 12;
  const interestRatePerCycle =
    includeInterest && interestRateAnnualPercent != null && interestRateAnnualPercent > 0
      ? interestRateAnnualPercent / 100 / cyclesPerYear
      : 0;

  for (let i = 0; i < maxCycles; i++) {
    const { start: cycleStart, end: cycleEnd } = getCycleDateRange(
      start,
      i,
      config
    );

    if (interestRatePerCycle > 0) {
      balance = balance * (1 + interestRatePerCycle);
    }
    balance = Math.max(0, Math.round((balance - amountPerCycle) * 100) / 100);

    points.push({
      date: cycleEnd,
      cycleIndex: i,
      balance,
      cycleStart,
      cycleEnd,
    });

    if (balance <= 0) break;
  }

  return points;
}

/**
 * Number of cycles to reach savings goal from a fixed amount per cycle.
 */
export function cyclesToGoalFromAmount(
  currentAmount: number,
  targetAmount: number,
  amountPerCycle: number
): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  if (amountPerCycle <= 0) return Infinity;
  return Math.ceil(remaining / amountPerCycle);
}

/**
 * Number of cycles to clear repayment at a fixed amount per cycle.
 */
export function cyclesToClearFromAmount(
  currentBalance: number,
  amountPerCycle: number
): number {
  if (currentBalance <= 0) return 0;
  if (amountPerCycle <= 0) return Infinity;
  return Math.ceil(currentBalance / amountPerCycle);
}

/**
 * End date of the Nth cycle (0-based) from effective start.
 */
export function endDateFromCycles(
  cycleStartDate: string,
  cycleIndex: number,
  config: PayCycleConfig
): string {
  const start = effectiveStartDate(cycleStartDate);
  const { end } = getCycleDateRange(start, cycleIndex, config);
  return end;
}
