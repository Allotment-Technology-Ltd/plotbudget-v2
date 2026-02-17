'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { Household, PayCycle } from '@repo/supabase';
import { formatCurrency, currencySymbol } from '@/lib/utils/currency';
import { formatBudgetAdherenceDiff } from '@/lib/utils/budget-adherence';

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
  { key: 'needs' as const, label: 'Needs', allocKeys: ['alloc_needs_me', 'alloc_needs_partner', 'alloc_needs_joint'] as const, color: '#8DA399' },
  { key: 'wants' as const, label: 'Wants', allocKeys: ['alloc_wants_me', 'alloc_wants_partner', 'alloc_wants_joint'] as const, color: '#C78D75' },
  { key: 'savings' as const, label: 'Savings', allocKeys: ['alloc_savings_me', 'alloc_savings_partner', 'alloc_savings_joint'] as const, color: '#6EC97C' },
  { key: 'repay' as const, label: 'Repay', allocKeys: ['alloc_repay_me', 'alloc_repay_partner', 'alloc_repay_joint'] as const, color: '#EF5350' },
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
    const totalAllocated = c.total_allocated ?? 0;
    const totalIncome = c.total_income ?? 0;
    /** Use total allocated as budget base so "of budget" = adherence to target proportion of what you've allocated. */
    const budgetBase = totalAllocated > 0 ? totalAllocated : totalIncome;
    const categories = CATEGORIES.map((cat) => {
      const percent = (household[PERCENT_KEYS[cat.key]] as number) ?? 0;
      const budgeted = budgetBase > 0 && Number.isFinite(percent) ? (budgetBase * percent) / 100 : 0;
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

/** Build chart data for stacked bar: one bar per cycle, segments = category amounts. */
function buildStackedBarData(
  heatmapData: ReturnType<typeof buildHeatmapData>
): { cycleLabel: string; needs: number; wants: number; savings: number; repay: number; categories: typeof heatmapData[0]['categories'] }[] {
  return heatmapData.map((row) => {
    const needs = row.categories.find((c) => c.key === 'needs')?.allocated ?? 0;
    const wants = row.categories.find((c) => c.key === 'wants')?.allocated ?? 0;
    const savings = row.categories.find((c) => c.key === 'savings')?.allocated ?? 0;
    const repay = row.categories.find((c) => c.key === 'repay')?.allocated ?? 0;
    return {
      cycleLabel: row.cycleLabel,
      needs,
      wants,
      savings,
      repay,
      categories: row.categories,
    };
  });
}

export function SpendingTrends({
  currentCycle,
  historicalCycles,
  household,
}: SpendingTrendsProps) {
  const currency = (household.currency as 'GBP' | 'USD' | 'EUR') ?? 'GBP';
  const data = buildHeatmapData(currentCycle, historicalCycles, household);
  const stackedData = buildStackedBarData(data);
  const totalAllocated = currentCycle.total_allocated ?? 0;
  const totalIncome = currentCycle.total_income ?? 0;
  const hasAllocation = data.some((row) =>
    row.categories.some((c) => c.allocated > 0)
  );

  /** Current cycle summary: allocation, actual %, and diff vs target. */
  const currentRow = data[data.length - 1];
  const totalForCurrent = currentRow
    ? currentRow.categories.reduce((s, c) => s + c.allocated, 0)
    : 0;
  const summaryItems =
    currentRow && totalForCurrent > 0
      ? currentRow.categories
          .filter((c) => c.allocated > 0)
          .map((cat) => {
            const actualPct = Math.round((cat.allocated / totalForCurrent) * 100);
            const targetPct = (household[PERCENT_KEYS[cat.key as keyof typeof PERCENT_KEYS]] as number) ?? 0;
            const diffText = formatBudgetAdherenceDiff(actualPct, targetPct);
            return {
              key: cat.key,
              label: cat.label,
              allocated: cat.allocated,
              actualPct,
              diffText,
            };
          })
      : [];

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
      <p className="text-sm text-muted-foreground mb-4">
        Actual allocation vs your target split. Bars show amount per pay cycle.
      </p>

      {summaryItems.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2 mb-6" role="region" aria-label="Current cycle budget adherence">
          {summaryItems.map((item) => (
            <p key={item.key} className="text-sm">
              <span className="font-medium">{item.label}</span>
              {' '}
              <span className="text-foreground">{formatCurrency(item.allocated, currency)} ({item.actualPct}%)</span>
              {item.diffText && (
                <span className="text-muted-foreground">
                  . {item.diffText}
                </span>
              )}
            </p>
          ))}
        </div>
      )}

      {hasAllocation && stackedData.length > 0 ? (
        <>
          <div className="h-72 w-full" aria-label="Budget adherence stacked bar chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedData}
                margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
                role="img"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="cycleLabel"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={stackedData.length > 8 ? Math.floor(stackedData.length / 8) : 0}
                />
                <YAxis
                  tickFormatter={(v) => `${currencySymbol(currency)}${v}`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--muted) / 0.3)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length || !label) return null;
                    const point = payload[0]?.payload as (typeof stackedData)[0];
                    const total = (point?.needs ?? 0) + (point?.wants ?? 0) + (point?.savings ?? 0) + (point?.repay ?? 0);
                    return (
                      <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-sm">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1">
                          {point?.categories
                            .filter((cell) => cell.allocated > 0)
                            .map((cell) => {
                              const actualPct = total > 0 ? Math.round((cell.allocated / total) * 100) : 0;
                              const targetPct = (household[PERCENT_KEYS[cell.key as keyof typeof PERCENT_KEYS]] as number) ?? 0;
                              const diffText = formatBudgetAdherenceDiff(actualPct, targetPct);
                              return (
                                <div key={cell.key} className="flex justify-between gap-4">
                                  <span>{cell.label}:</span>
                                  <span>
                                    {formatCurrency(cell.allocated, currency)} ({actualPct}%)
                                    {diffText != null && (
                                      <span className="text-muted-foreground">. {diffText}</span>
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => CATEGORIES.find((c) => c.key === value)?.label ?? value}
                />
                {CATEGORIES.map((cat) => (
                  <Bar
                    key={cat.key}
                    dataKey={cat.key}
                    stackId="budget"
                    fill={cat.color}
                    radius={0}
                    name={cat.key}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          {totalIncome > 0 && totalAllocated > totalIncome && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-4">
              Total allocated ({formatCurrency(totalAllocated, currency)}) exceeds income ({formatCurrency(totalIncome, currency)}).
            </p>
          )}
        </>
      ) : (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Add expenses in Blueprint to see your allocation by category. Each completed pay cycle adds a new bar.
        </p>
      )}
    </motion.section>
  );
}
