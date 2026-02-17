/**
 * Forecast projection for native app.
 * Uses shared logic from @repo/logic for cycle dates.
 */

import {
  calculateCycleEndDate,
  calculateNextCycleDates,
  type PayCycleType,
} from '@repo/logic';

function countPayCyclesUntil(
  startDateStr: string,
  targetDateStr: string,
  payCycleType: PayCycleType
): number {
  const start = new Date(startDateStr);
  const target = new Date(targetDateStr);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  if (target <= start) return 0;
  if (payCycleType === 'every_4_weeks') {
    const msPerCycle = 28 * 24 * 60 * 60 * 1000;
    return Math.max(1, Math.ceil((target.getTime() - start.getTime()) / msPerCycle));
  }
  const months =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());
  return Math.max(1, months);
}

export function suggestedSavingsAmount(
  currentAmount: number,
  targetAmount: number,
  cycleStartDate: string,
  targetDate: string | null,
  payCycleType: PayCycleType
): number | null {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  if (!targetDate) return null;
  const start = effectiveStartDate(cycleStartDate);
  const cycles = countPayCyclesUntil(start, targetDate, payCycleType);
  return Math.ceil((remaining / cycles) * 100) / 100;
}

export function suggestedRepaymentAmount(
  currentBalance: number,
  cycleStartDate: string,
  targetDate: string | null,
  payCycleType: PayCycleType
): number | null {
  if (currentBalance <= 0) return 0;
  if (!targetDate) return null;
  const start = effectiveStartDate(cycleStartDate);
  const cycles = countPayCyclesUntil(start, targetDate, payCycleType);
  return Math.ceil((currentBalance / cycles) * 100) / 100;
}

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

function effectiveStartDate(cycleStartStr: string): string {
  const cycleStart = new Date(cycleStartStr);
  const today = new Date();
  cycleStart.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return cycleStart > today ? iso(cycleStart) : iso(today);
}

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
    if (i === cycleIndex) return { start: next.start, end: next.end };
  }
  return { start: effectiveStart, end: prevEnd };
}

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

  if (balance >= targetAmount || amountPerCycle <= 0) {
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
  const {
    includeInterest = false,
    interestRateAnnualPercent,
    maxCycles = 60,
  } = options;
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

  const cyclesPerYear =
    config.payCycleType === 'every_4_weeks' ? 52 / 4 : 12;
  const interestRatePerCycle =
    includeInterest &&
    interestRateAnnualPercent != null &&
    interestRateAnnualPercent > 0
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

export function cyclesToClearFromAmount(
  currentBalance: number,
  amountPerCycle: number
): number {
  if (currentBalance <= 0) return 0;
  if (amountPerCycle <= 0) return Infinity;
  return Math.ceil(currentBalance / amountPerCycle);
}

export function endDateFromCycles(
  cycleStartDate: string,
  cycleIndex: number,
  config: PayCycleConfig
): string {
  const start = effectiveStartDate(cycleStartDate);
  const { end } = getCycleDateRange(start, cycleIndex, config);
  return end;
}
