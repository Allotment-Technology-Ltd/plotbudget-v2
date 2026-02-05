/**
 * Pay cycle date utilities.
 * All dates use working days: if a pay day falls on Saturday → Friday, Sunday → Friday.
 */

/** Get day of week: 0 = Sunday, 6 = Saturday */
function getDayOfWeek(d: Date): number {
  return d.getDay();
}

/**
 * Get the last working day of a given month.
 * If last day is Saturday → use Friday. If Sunday → use Friday.
 */
export function getLastWorkingDay(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const dow = getDayOfWeek(lastDay);
  if (dow === 0) {
    lastDay.setDate(lastDay.getDate() - 2);
  } else if (dow === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

/**
 * Adjust a date to the previous working day if it falls on a weekend.
 */
export function toWorkingDay(d: Date): Date {
  const result = new Date(d);
  const dow = getDayOfWeek(result);
  if (dow === 0) {
    result.setDate(result.getDate() - 2);
  } else if (dow === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

/**
 * Calculate cycle start date for the current cycle.
 * - specific_date: pay day of (this month or last month)
 * - last_working_day: day after last working day of previous month
 * - every_4_weeks: anchor date
 */
export function calculateCycleStartDate(
  type: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  payDay?: number,
  anchorDate?: string
): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (type === 'every_4_weeks' && anchorDate) {
    return anchorDate;
  }

  if (type === 'specific_date' && payDay != null) {
    const thisMonthPay = new Date(today.getFullYear(), today.getMonth(), payDay);
    const thisMonthPayWorking = toWorkingDay(thisMonthPay);
    if (thisMonthPayWorking > today) {
      const lastMonthPay = new Date(today.getFullYear(), today.getMonth() - 1, payDay);
      const lastMonthPayWorking = toWorkingDay(lastMonthPay);
      return lastMonthPayWorking.toISOString().split('T')[0];
    }
    return thisMonthPayWorking.toISOString().split('T')[0];
  }

  if (type === 'last_working_day') {
    const prevMonthLWD = getLastWorkingDay(today.getFullYear(), today.getMonth() - 1);
    const start = new Date(prevMonthLWD);
    start.setDate(start.getDate() + 1);
    return start.toISOString().split('T')[0];
  }

  return today.toISOString().split('T')[0];
}

/**
 * Calculate cycle end date.
 * - specific_date: last working day before next month's pay day
 * - last_working_day: last working day of current month
 * - every_4_weeks: 28 days after start
 */
export function calculateCycleEndDate(
  type: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  startDate: string,
  payDay?: number
): string {
  const start = new Date(startDate);

  if (type === 'every_4_weeks') {
    const end = new Date(start);
    end.setDate(end.getDate() + 27);
    return end.toISOString().split('T')[0];
  }

  if (type === 'last_working_day') {
    const lwd = getLastWorkingDay(start.getFullYear(), start.getMonth() + 1);
    return lwd.toISOString().split('T')[0];
  }

  if (type === 'specific_date' && payDay != null) {
    const nextPay = new Date(start.getFullYear(), start.getMonth() + 1, payDay);
    const end = toWorkingDay(nextPay);
    return end.toISOString().split('T')[0];
  }

  const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, payDay ?? 1);
  nextMonth.setDate(nextMonth.getDate() - 1);
  return nextMonth.toISOString().split('T')[0];
}

/**
 * Calculate next cycle start and end dates from a previous cycle's end date.
 */
export function calculateNextCycleDates(
  prevEndDate: string,
  type: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  payDay?: number
): { start: string; end: string } {
  const prevEnd = new Date(prevEndDate);
  const start = new Date(prevEnd);
  start.setDate(start.getDate() + 1);

  let end: Date;

  if (type === 'every_4_weeks') {
    end = new Date(start);
    end.setDate(end.getDate() + 27);
  } else if (type === 'last_working_day') {
    end = getLastWorkingDay(start.getFullYear(), start.getMonth() + 1);
  } else {
    const nextPay = new Date(start.getFullYear(), start.getMonth() + 1, payDay ?? 1);
    end = toWorkingDay(nextPay);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
