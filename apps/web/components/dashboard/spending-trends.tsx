'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Household, PayCycle } from '@repo/supabase';
import { formatCurrency } from '@/lib/utils/currency';

type HistoricalCycle = Pick<
  PayCycle,
  | 'id'
  | 'name'
  | 'start_date'
  | 'end_date'
  | 'total_income'
  | 'total_allocated'
  | 'alloc_needs_me'
  | 'alloc_needs_partner'
  | 'alloc_needs_joint'
  | 'alloc_wants_me'
  | 'alloc_wants_partner'
  | 'alloc_wants_joint'
  | 'alloc_savings_me'
  | 'alloc_savings_partner'
  | 'alloc_savings_joint'
  | 'alloc_repay_me'
  | 'alloc_repay_partner'
  | 'alloc_repay_joint'
>;

interface SpendingTrendsProps {
  currentCycle: PayCycle;
  historicalCycles: HistoricalCycle[];
  household: Household;
}

const CATEGORIES = [
  { key: 'needs' as const, label: 'Needs', allocKeys: ['alloc_needs_me', 'alloc_needs_partner', 'alloc_needs_joint'] as const },
  { key: 'wants' as const, label: 'Wants', allocKeys: ['alloc_wants_me', 'alloc_wants_partner', 'alloc_wants_joint'] as const },
  { key: 'savings' as const, label: 'Savings', allocKeys: ['alloc_savings_me', 'alloc_savings_partner', 'alloc_savings_joint'] as const },
  { key: 'repay' as const, label: 'Repay', allocKeys: ['alloc_repay_me', 'alloc_repay_partner', 'alloc_repay_joint'] as const },
] as const;

const PERCENT_KEYS: Record<(typeof CATEGORIES)[number]['key'], keyof Household> = {
  needs: 'needs_percent',
  wants: 'wants_percent',
  savings: 'savings_percent',
  repay: 'repay_percent',
};

function getAllocated(cycle: HistoricalCycle | PayCycle, allocKeys: readonly string[]): number {
  let sum = 0;
  const row = cycle as Record<string, unknown>;
  for (const k of allocKeys) {
    const v = row[k];
    if (typeof v === 'number' && Number.isFinite(v)) sum += v;
  }
  return sum;
}

function getBudgeted(totalIncome: number, percent: number): number {
  if (totalIncome <= 0 || !Number.isFinite(percent)) return 0;
  return (totalIncome * percent) / 100;
}

/** 0–80% green, 80–100% amber, >100% red */
function adherenceColor(pctUsed: number): string {
  if (!Number.isFinite(pctUsed) || pctUsed <= 0) return 'bg-muted';
  if (pctUsed <= 80) return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300';
  if (pctUsed <= 100) return 'bg-amber-500/20 text-amber-800 dark:text-amber-300';
  return 'bg-red-500/20 text-red-800 dark:text-red-300';
}

function buildHeatmapData(
  current: PayCycle,
  historical: HistoricalCycle[],
  household: Household
): {
  cycleId: string;
  cycleLabel: string;
  categories: { key: string; label: string; budgeted: number; allocated: number; pctUsed: number }[];
}[] {
  const cycles = [...historical].reverse().concat([current]);
  return cycles.map((c) => {
    const cycleLabel =
      c.name ||
      `${format(new Date(c.start_date), 'MMM d')} – ${format(new Date(c.end_date), 'MMM d')}`;
    const totalIncome = c.total_income ?? 0;
    const categories = CATEGORIES.map((cat) => {
      const percent = (household[PERCENT_KEYS[cat.key]] as number) ?? 0;
      const budgeted = getBudgeted(totalIncome, percent);
      const allocated = getAllocated(c, cat.allocKeys);
      const pctUsed = budgeted > 0 ? (allocated / budgeted) * 100 : 0;
      return {
        key: cat.key,
        label: cat.label,
        budgeted,
        allocated,
        pctUsed,
      };
    });
    return { cycleId: c.id, cycleLabel, categories };
  });
}

export function SpendingTrends({
  currentCycle,
  historicalCycles,
  household,
}: SpendingTrendsProps) {
  const currency = (household.currency as 'GBP' | 'USD' | 'EUR') ?? 'GBP';
  const data = buildHeatmapData(currentCycle, historicalCycles, household);

  if (data.length < 2) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Spending trends"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Budget Adherence
        </h2>
        <p className="text-muted-foreground text-sm py-8 text-center">
          Complete more pay cycles to see budget adherence across Needs, Wants, Savings, and Repay.
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Budget adherence"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-2">
        Budget Adherence
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        % of budget used per category. Green = on track, amber = near limit, red = over budget.
      </p>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          role="grid"
          aria-label="Budget adherence by cycle and category"
        >
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
              {data.map((row) => (
                <th key={row.cycleId} className="text-center py-2 px-2 font-medium text-foreground min-w-[100px]">
                  {row.cycleLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => (
              <tr key={cat.key} className="border-b border-border/50 last:border-b-0">
                <td className="py-2 pr-4 font-medium text-foreground">{cat.label}</td>
                {data.map((row) => {
                  const cell = row.categories.find((c) => c.key === cat.key);
                  if (!cell) return <td key={row.cycleId} />;
                  const colorClass = adherenceColor(cell.pctUsed);
                  const pctText = cell.budgeted > 0 ? `${Math.round(cell.pctUsed)}%` : '–';
                  return (
                    <td key={row.cycleId} className="py-2 px-2 text-center">
                      <span
                        className={`inline-block rounded px-2 py-1 min-w-[3rem] ${colorClass}`}
                        title={`${cell.label}: ${formatCurrency(cell.allocated, currency)} / ${formatCurrency(cell.budgeted, currency)} (${pctText})`}
                      >
                        {pctText}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
