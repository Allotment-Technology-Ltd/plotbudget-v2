/**
 * Budget adherence helpers: compute actual vs target percentage diff text.
 */

export interface BudgetAdherenceItem {
  key: string;
  label: string;
  allocated: number;
  actualPct: number;
  diffText: string | null;
}

/**
 * Compute the diff text for a category: "X% over target of Y%", "X% under target of Y%", or "On target (Y%)".
 * Returns null when targetPct is 0 (no target set).
 */
export function formatBudgetAdherenceDiff(actualPct: number, targetPct: number): string | null {
  if (!(targetPct > 0)) return null;
  const diff = actualPct - targetPct;
  if (diff > 0) return `${diff}% over target of ${targetPct}%`;
  if (diff < 0) return `${Math.abs(diff)}% under target of ${targetPct}%`;
  return `On target (${targetPct}%)`;
}
