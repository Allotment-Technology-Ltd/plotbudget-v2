/**
 * Blueprint category grid and derived totals from seeds.
 * Extracted so the screen file stays focused on UI.
 */

export type SeedType = 'need' | 'want' | 'savings' | 'repay';

export const CATEGORY_GRID = [
  { key: 'needs' as const, label: 'Needs', percentKey: 'needs_percent' as const, allocKey: 'alloc_needs' as const, remKey: 'rem_needs' as const, seedType: 'need' as const },
  { key: 'wants' as const, label: 'Wants', percentKey: 'wants_percent' as const, allocKey: 'alloc_wants' as const, remKey: 'rem_wants' as const, seedType: 'want' as const },
  { key: 'savings' as const, label: 'Savings', percentKey: 'savings_percent' as const, allocKey: 'alloc_savings' as const, remKey: 'rem_savings' as const, seedType: 'savings' as const },
  { key: 'repay' as const, label: 'Repay', percentKey: 'repay_percent' as const, allocKey: 'alloc_repay' as const, remKey: 'rem_repay' as const, seedType: 'repay' as const },
] as const;

export type CategoryGridItem = (typeof CATEGORY_GRID)[number];

/** Seed-like shape needed for category totals (Blueprint seeds have type, amount, payment_source, is_paid, etc.). */
interface SeedForTotals {
  type: string;
  amount: number;
  payment_source: string;
  is_paid?: boolean;
  amount_me?: number;
  amount_partner?: number;
  is_paid_me?: boolean;
  is_paid_partner?: boolean;
}

/** Compute per-category allocated and remaining from seeds. Used so cards are correct when paycycle alloc_* / rem_* are stale. */
export function computeCategoryTotalsFromSeeds(
  seeds: SeedForTotals[],
  categoryGrid: readonly CategoryGridItem[]
): Record<string, { allocated: number; remaining: number }> {
  const out: Record<string, { allocated: number; remaining: number }> = {};
  for (const cat of categoryGrid) {
    const seedsInCat = seeds.filter((s) => s.type === cat.seedType);
    const allocated = seedsInCat.reduce((sum, s) => sum + Number(s.amount), 0);
    let remaining = 0;
    for (const s of seedsInCat) {
      if (s.payment_source === 'me' || s.payment_source === 'partner') {
        remaining += s.is_paid ? 0 : Number(s.amount);
      } else {
        remaining += (s.is_paid_me ? 0 : Number(s.amount_me ?? 0)) + (s.is_paid_partner ? 0 : Number(s.amount_partner ?? 0));
      }
    }
    out[cat.key] = { allocated, remaining };
  }
  return out;
}
