/**
 * Pay cycle date utilities (shared by web and native onboarding).
 * All dates use working days: if a pay day falls on Saturday → Friday, Sunday → Friday.
 */

function getDayOfWeek(d: Date): number {
  return d.getDay();
}

function getLastWorkingDay(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const dow = getDayOfWeek(lastDay);
  if (dow === 0) {
    lastDay.setDate(lastDay.getDate() - 2);
  } else if (dow === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

function toWorkingDay(d: Date): Date {
  const result = new Date(d);
  const dow = getDayOfWeek(result);
  if (dow === 0) {
    result.setDate(result.getDate() - 2);
  } else if (dow === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

export type PayCycleType = 'specific_date' | 'last_working_day' | 'every_4_weeks';

/**
 * Calculate cycle start date for the current cycle.
 * - specific_date: pay day of (this month or last month)
 * - last_working_day: day after last working day of previous month
 * - every_4_weeks: anchor date
 */
export function calculateCycleStartDate(
  type: PayCycleType,
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
  type: PayCycleType,
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
    // End = LWD of the month that contains start. If start is after that LWD (e.g. 31 Jan after 30 Jan),
    // the cycle spans into next month so end = LWD of next month (fixes onboarding-in-February bug).
    const lwdSameMonth = getLastWorkingDay(start.getFullYear(), start.getMonth());
    const lwdDate = lwdSameMonth.toISOString().split('T')[0];
    if (lwdDate >= startDate) return lwdDate;
    const lwdNextMonth = getLastWorkingDay(start.getFullYear(), start.getMonth() + 1);
    return lwdNextMonth.toISOString().split('T')[0];
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
