'use client';

import { useId } from 'react';
import { format } from 'date-fns';
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Legend,
} from 'recharts';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';
import { currencySymbol, formatCurrency } from '@/lib/utils/currency';
import type { PayCycle } from '@repo/supabase';

type HistoricalCycle = Pick<
  PayCycle,
  | 'id'
  | 'name'
  | 'start_date'
  | 'end_date'
  | 'alloc_savings_me'
  | 'alloc_savings_partner'
  | 'alloc_savings_joint'
>;

function getSavingsAmount(cycle: HistoricalCycle | PayCycle): number {
  const row = cycle as Record<string, unknown>;
  const me = (row.alloc_savings_me as number) ?? 0;
  const partner = (row.alloc_savings_partner as number) ?? 0;
  const joint = (row.alloc_savings_joint as number) ?? 0;
  return (Number.isFinite(me) ? me : 0) + (Number.isFinite(partner) ? partner : 0) + (Number.isFinite(joint) ? joint : 0);
}

interface SavingsTrendChartProps {
  currentCycle: PayCycle | null;
  historicalCycles: HistoricalCycle[];
  currency?: 'GBP' | 'USD' | 'EUR';
}

const SAVINGS_COLOR = '#6EC97C';

export function SavingsTrendChart({
  currentCycle,
  historicalCycles,
  currency = 'GBP',
}: SavingsTrendChartProps) {
  const gradientId = useId();
  const symbol = currencySymbol(currency);
  const isNarrow = useIsNarrowScreen();
  const cycles = [...historicalCycles].reverse();
  if (currentCycle) cycles.push(currentCycle as HistoricalCycle);

  let cumulative = 0;
  const cyclePoints = cycles.map((c) => {
    const amount = getSavingsAmount(c);
    cumulative += amount;
    return {
      cycleId: c.id,
      label:
        c.name ||
        `${format(new Date(c.start_date), 'MMM d')} – ${format(new Date(c.end_date), 'MMM d')}`,
      amount,
      cumulative,
    };
  });
  // Prepend origin point so Area has ≥2 points (single cycle otherwise renders only a dot)
  const chartData = [
    { cycleId: '__origin', label: '', amount: 0, cumulative: 0 },
    ...cyclePoints,
  ];

  const hasData = chartData.length > 0 && chartData.some((d) => d.amount > 0);
  const xAxisInterval =
    isNarrow && chartData.length > 4
      ? Math.floor(chartData.length / 4)
      : chartData.length > 7
        ? Math.floor(chartData.length / 6)
        : 0;

  if (!hasData) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border" aria-label="Savings over time">
        <h2 className="font-heading text-xl uppercase tracking-wider mb-2">Savings over time</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Cumulative amount allocated to savings over pay cycles.
        </p>
        <div className="h-48 flex items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground text-sm">
          Add savings goals in Blueprint and lock in amounts to see your trend.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border" aria-label="Savings over time">
      <h2 className="font-heading text-xl uppercase tracking-wider mb-2">Savings over time</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Cumulative amount allocated to savings over pay cycles.
      </p>

      <div className="h-64 w-full" aria-label="Savings trend chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`savings-grad-${gradientId.replace(/:/g, '-')}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={SAVINGS_COLOR} stopOpacity={0.6} />
                <stop offset="100%" stopColor={SAVINGS_COLOR} stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="cycleId"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              scale="point"
              interval={xAxisInterval}
              tickFormatter={(value) =>
                value === '__origin' ? '' : (chartData.find((d) => d.cycleId === value)?.label ?? '')
              }
            />
            <YAxis
              domain={[0, 'auto']}
              tickFormatter={(v) => `${symbol}${v}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value: number | undefined) => [value != null ? formatCurrency(value, currency) : '–', 'Cumulative']}
              contentStyle={{
                backgroundColor: 'rgb(var(--popover))',
                color: 'rgb(var(--popover-foreground))',
                border: '1px solid rgb(var(--popover-foreground) / 0.2)',
                borderRadius: 'var(--radius)',
                padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                fontSize: '14px',
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={SAVINGS_COLOR}
              strokeWidth={1}
              fill={`url(#savings-grad-${gradientId.replace(/:/g, '-')})`}
              stackId="savings"
              name="Cumulative savings"
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
