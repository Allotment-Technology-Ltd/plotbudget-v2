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
    const lwd = getLastWorkingDay(start.getFullYear(), start.getMonth());
    return lwd.toISOString().split('T')[0];
  }

  if (type === 'specific_date' && payDay != null) {
    const nextPay = new Date(start.getFullYear(), start.getMonth() + 1, payDay);
    const nextPayWorking = toWorkingDay(nextPay);
    const dayBeforeNextPay = new Date(nextPayWorking);
    dayBeforeNextPay.setDate(dayBeforeNextPay.getDate() - 1);
    const end = toWorkingDay(dayBeforeNextPay);
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
    // End = last working day of the month that contains cycle start
    end = getLastWorkingDay(start.getFullYear(), start.getMonth());
  } else {
    // specific_date: end = last working day before next month's pay day (so next pay funds next cycle)
    const nextPay = new Date(start.getFullYear(), start.getMonth() + 1, payDay ?? 1);
    const nextPayWorking = toWorkingDay(nextPay);
    end = new Date(nextPayWorking);
    end.setDate(end.getDate() - 1);
    end = toWorkingDay(end);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export type FrequencyRule = 'specific_date' | 'last_working_day' | 'every_4_weeks';

/**
 * Get all payment dates for a single income source within [rangeStart, rangeEnd] (inclusive).
 * Used by the projection engine to count how many times an income lands in a cycle (handles double-dip for 4-weekly).
 */
export function getPaymentDatesInRange(
  rangeStart: string,
  rangeEnd: string,
  frequencyRule: FrequencyRule,
  dayOfMonth?: number | null,
  anchorDate?: string | null
): string[] {
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const out: string[] = [];

  if (frequencyRule === 'specific_date' && dayOfMonth != null) {
    let year = start.getFullYear();
    let month = start.getMonth();
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    while (year < endYear || (year === endYear && month <= endMonth)) {
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(dayOfMonth, lastDayOfMonth);
      const candidate = new Date(year, month, day);
      if (candidate >= start && candidate <= end) {
        const working = toWorkingDay(candidate);
        const str = working.toISOString().split('T')[0];
        if (!out.includes(str)) out.push(str);
      }
      if (month === 11) {
        month = 0;
        year += 1;
      } else {
        month += 1;
      }
    }
    return out.sort();
  }

  if (frequencyRule === 'last_working_day') {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const lwd = getLastWorkingDay(cur.getFullYear(), cur.getMonth());
      if (lwd >= start && lwd <= end) {
        const str = lwd.toISOString().split('T')[0];
        if (!out.includes(str)) out.push(str);
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    return out.sort();
  }

  if (frequencyRule === 'every_4_weeks' && anchorDate) {
    const anchor = new Date(anchorDate);
    anchor.setHours(0, 0, 0, 0);
    let pay = new Date(anchor);
    while (pay <= end) {
      if (pay >= start) {
        const str = pay.toISOString().split('T')[0];
        if (!out.includes(str)) out.push(str);
      }
      pay.setDate(pay.getDate() + 28);
    }
    return out.sort();
  }

  return out;
}