/**
 * Validates that a due date falls within a pay cycle.
 * Returns a user-facing error when the date is before or after the cycle.
 */

export type DueDateCycleResult =
  | { valid: true }
  | { valid: false; message: string };

/**
 * Check if dueDate is within [startDate, endDate] (inclusive).
 * If invalid, returns a message: before cycle → use a date in range;
 * after cycle → create a new cycle and add the bill there, or correct the date.
 */
export function validateDueDateInCycle(
  dueDate: string | null | undefined,
  startDate: string,
  endDate: string
): DueDateCycleResult {
  const trimmed = dueDate?.trim();
  if (!trimmed) return { valid: true };

  if (trimmed < startDate) {
    return {
      valid: false,
      message: `Due date is before this cycle. Use a date between ${startDate} and ${endDate}.`,
    };
  }

  if (trimmed > endDate) {
    return {
      valid: false,
      message:
        'Due date is after this cycle. Create a new cycle and add the bill there, or pick a date within this cycle if it was a mistake.',
    };
  }

  return { valid: true };
}
