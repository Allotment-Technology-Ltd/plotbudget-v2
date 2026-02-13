/**
 * Pure utilities for seed/bill logic. Safe to use from any context (server, client, API).
 */

/**
 * Roll a seed's due date to the next suitable date within a cycle [cycleStart, cycleEnd].
 * Uses the same day-of-month in the cycle start's month (clamped to last day of month),
 * then clamps to the cycle range.
 */
export function rollDueDateToCycle(
  oldDueDate: string | null,
  cycleStart: string,
  cycleEnd: string
): string | null {
  if (!oldDueDate || !oldDueDate.trim()) return null;
  const orig = new Date(oldDueDate);
  if (Number.isNaN(orig.getTime())) return null;
  const origDay = orig.getDate();
  const [cyStartY, cyStartM] = cycleStart.split('-').map(Number);
  const month0 = cyStartM - 1;
  const lastDay = new Date(cyStartY, month0 + 1, 0).getDate();
  const day = Math.min(origDay, lastDay);
  let result = new Date(cyStartY, month0, day);
  const start = new Date(cycleStart);
  const end = new Date(cycleEnd);
  if (result < start) result = start;
  if (result > end) result = end;
  const y = result.getFullYear();
  const m = result.getMonth() + 1;
  const d = result.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
