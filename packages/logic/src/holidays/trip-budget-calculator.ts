import type { BudgetCategory } from './schemas';

export interface TripBudgetItemInput {
  category: BudgetCategory;
  planned_amount: number;
  actual_amount: number | null;
}

export interface CategoryBreakdown {
  category: BudgetCategory;
  planned: number;
  actual: number;
  difference: number;
}

export interface TripBudgetSummary {
  categories: CategoryBreakdown[];
  totalPlanned: number;
  totalActual: number;
  totalDifference: number;
}

/**
 * Pure function — no I/O.
 * Takes an array of budget items and returns per-category totals
 * (planned, actual, difference) plus overall totals.
 * Exposes the full breakdown so the UI can display workings, not just
 * the final sum (User Autonomy principle).
 */
export function calculateTripBudget(items: TripBudgetItemInput[]): TripBudgetSummary {
  const categoryMap = new Map<BudgetCategory, { planned: number; actual: number }>();

  for (const item of items) {
    const existing = categoryMap.get(item.category) ?? { planned: 0, actual: 0 };
    categoryMap.set(item.category, {
      planned: existing.planned + item.planned_amount,
      actual: existing.actual + (item.actual_amount ?? 0),
    });
  }

  const categories: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
    ([category, totals]) => ({
      category,
      planned: totals.planned,
      actual: totals.actual,
      difference: totals.actual - totals.planned,
    })
  );

  const totalPlanned = categories.reduce((sum, c) => sum + c.planned, 0);
  const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);

  return {
    categories,
    totalPlanned,
    totalActual,
    totalDifference: totalActual - totalPlanned,
  };
}
