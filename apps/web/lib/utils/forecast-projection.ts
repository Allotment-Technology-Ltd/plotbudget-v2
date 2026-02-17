/**
 * Forecast projection utilities for savings and repayments.
 * Projects balance over time by pay cycle.
 */

import type { PayCycleType } from './suggested-amount';
import { countPayCyclesUntil } from './suggested-amount';
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
 * Project savings balance over a fixed number of cycles with no target ceiling.
 * Use for "if I save X per cycle for N cycles, how much would I have?" scenarios.
 */
export function projectSavingsOverTimeFixedCycles(
  currentAmount: number,
  amountPerCycle: number,
  cycleStartDate: string,
  config: PayCycleConfig,
  numCycles: number
): ProjectionPoint[] {
  const start = effectiveStartDate(cycleStartDate);
  const points: ProjectionPoint[] = [];
  let balance = currentAmount;
  const cycles = Math.max(1, Math.min(numCycles, 120));

  for (let i = 0; i < cycles; i++) {
    const { start: cycleStart, end: cycleEnd } = getCycleDateRange(start, i, config);
    if (amountPerCycle > 0) {
      balance += amountPerCycle;
    }
    points.push({
      date: cycleEnd,
      cycleIndex: i,
      balance: Math.round(balance * 100) / 100,
      cycleStart,
      cycleEnd,
    });
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
 * Total amount paid (principal + interest) for a repayment plan.
 * Used to compare total cost with vs without overpayments.
 */
export function totalRepaymentCost(
  currentBalance: number,
  amountPerCycle: number,
  _cycleStartDate: string,
  config: PayCycleConfig,
  options: {
    interestRateAnnualPercent?: number | null;
    maxCycles?: number;
  } = {}
): { totalPaid: number; cycles: number } {
  const { interestRateAnnualPercent, maxCycles = 60 } = options;
  let balance = currentBalance;
  let totalPaid = 0;
  const cyclesPerYear =
    config.payCycleType === 'every_4_weeks' ? 52 / 4 : 12;
  const interestRatePerCycle =
    interestRateAnnualPercent != null && interestRateAnnualPercent > 0
      ? interestRateAnnualPercent / 100 / cyclesPerYear
      : 0;

  if (balance <= 0 || amountPerCycle <= 0) {
    return { totalPaid: 0, cycles: 0 };
  }

  for (let i = 0; i < maxCycles; i++) {
    if (interestRatePerCycle > 0) {
      balance = balance * (1 + interestRatePerCycle);
    }
    const payment = Math.min(amountPerCycle, balance);
    totalPaid += payment;
    balance = Math.max(0, Math.round((balance - payment) * 100) / 100);
    if (balance <= 0) {
      return { totalPaid, cycles: i + 1 };
    }
  }
  return { totalPaid, cycles: maxCycles };
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

/**
 * Cycle end date (label) for the cycle that contains the target date.
 * Used to position the target-date reference line on the chart.
 */
export function getCycleEndDateForTarget(
  cycleStartDate: string,
  targetDate: string,
  config: PayCycleConfig
): string {
  const start = effectiveStartDate(cycleStartDate);
  const cycles = countPayCyclesUntil(start, targetDate, config.payCycleType, config.payDay);
  const cycleIndex = Math.max(0, cycles - 1);
  return endDateFromCycles(cycleStartDate, cycleIndex, config);
}
