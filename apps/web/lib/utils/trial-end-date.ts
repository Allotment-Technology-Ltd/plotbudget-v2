/**
 * Compute when a user's PLOT trial ends based on pay cycles.
 * Trial = first 2 completed pay cycles.
 * - trial_cycles_completed 0: in cycle 1 → trial ends at end of cycle 2
 * - trial_cycles_completed 1: in cycle 2 → trial ends at end of current cycle
 */
import { calculateNextCycleDates } from './pay-cycle-dates';

type PayCycleType = 'specific_date' | 'last_working_day' | 'every_4_weeks';

export function getPlotTrialEndDate(
  trialCyclesCompleted: number,
  activeCycleEndDate: string,
  payCycleType: PayCycleType,
  payDay: number | null
): string | null {
  if (trialCyclesCompleted >= 2) return null;

  if (trialCyclesCompleted === 1) {
    return activeCycleEndDate;
  }

  const { end } = calculateNextCycleDates(
    activeCycleEndDate,
    payCycleType,
    payDay ?? undefined
  );
  return end;
}
