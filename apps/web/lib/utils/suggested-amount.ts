/**
 * Calculate suggested pay cycle amount to reach a target by a given date.
 * Uses household pay cycle type to estimate number of remaining cycles.
 */

export type PayCycleType = 'specific_date' | 'last_working_day' | 'every_4_weeks';

/**
 * Count pay cycles between start date and target date.
 * For monthly cycles (specific_date, last_working_day): count months.
 * For every_4_weeks: count 4-week periods.
 */
export function countPayCyclesUntil(
  startDateStr: string,
  targetDateStr: string,
  payCycleType: PayCycleType,
  _payDay?: number
): number {
  const start = new Date(startDateStr);
  const target = new Date(targetDateStr);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  if (target <= start) return 0;

  if (payCycleType === 'every_4_weeks') {
    const msPerCycle = 28 * 24 * 60 * 60 * 1000;
    const diff = target.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / msPerCycle));
  }

  // Monthly cycles
  const months =
    (target.getFullYear() - start.getFullYear()) * 12 +
    (target.getMonth() - start.getMonth());
  return Math.max(1, months);
}

/**
 * Suggested amount per pay cycle for savings: (target - current) / cycles remaining
 */
export function suggestedSavingsAmount(
  currentAmount: number,
  targetAmount: number,
  cycleStartDate: string,
  targetDate: string | null,
  payCycleType: PayCycleType,
  payDay?: number
): number | null {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  if (!targetDate) return null;

  const cycles = countPayCyclesUntil(
    cycleStartDate,
    targetDate,
    payCycleType,
    payDay
  );
  return Math.ceil((remaining / cycles) * 100) / 100;
}

/**
 * Suggested amount per pay cycle for repayments: current_balance / cycles remaining
 */
export function suggestedRepaymentAmount(
  currentBalance: number,
  cycleStartDate: string,
  targetDate: string | null,
  payCycleType: PayCycleType,
  payDay?: number
): number | null {
  if (currentBalance <= 0) return 0;
  if (!targetDate) return null;

  const cycles = countPayCyclesUntil(
    cycleStartDate,
    targetDate,
    payCycleType,
    payDay
  );
  return Math.ceil((currentBalance / cycles) * 100) / 100;
}
