'use client';

import { useId } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';
import { currencySymbol } from '@/lib/utils/currency';
import type { ProjectionPoint } from '@/lib/utils/forecast-projection';

const SAVINGS_COLOR = '#6EC97C';
const REPAY_COLOR = '#EF5350';
const REPAY_SUGGESTED_COLOR = '#90A4AE';

/** Chart data point: may include optional second series (suggested trajectory). */
export interface ChartDataPoint {
  date: string;
  cycleIndex: number;
  balance: number;
  label: string;
  balanceSuggested?: number | null;
}

interface ForecastChartProps {
  data: ProjectionPoint[];
  type: 'savings' | 'repay';
  currency?: 'GBP' | 'USD' | 'EUR';
  /** Second series: trajectory if paying suggested amount (e.g. to hit target date). */
  dataSuggested?: ProjectionPoint[] | null;
  /** Formatted cycle label for the target date (e.g. "Mar 2026"). Draws vertical reference line. */
  targetDateLabel?: string | null;
}

export function ForecastChart({
  data,
  type,
  currency = 'GBP',
  dataSuggested,
  targetDateLabel,
}: ForecastChartProps) {
  const gradientId = useId();
  const color = type === 'savings' ? SAVINGS_COLOR : REPAY_COLOR;
  const symbol = currencySymbol(currency);
  const hasTwoLines = dataSuggested != null && dataSuggested.length > 0;
  const isNarrow = useIsNarrowScreen();

  const chartData: ChartDataPoint[] = data.map((p) => ({
    ...p,
    label: format(new Date(p.date), 'MMM yyyy'),
    balance: p.balance,
    balanceSuggested: null,
  }));

  if (hasTwoLines) {
    const maxLen = Math.max(chartData.length, dataSuggested!.length);
    for (let i = 0; i < maxLen; i++) {
      const p = chartData[i];
      const ps = dataSuggested![i];
      if (!p) {
        const psPt = ps!;
        chartData.push({
          date: psPt.date,
          cycleIndex: i,
          balance: 0,
          label: format(new Date(psPt.date), 'MMM yyyy'),
          balanceSuggested: psPt.balance,
        });
      } else if (ps) {
        p.balanceSuggested = ps.balance;
      } else {
        p.balanceSuggested = 0;
      }
    }
  }

  const targetPoint = targetDateLabel
    ? chartData.find((d) => d.label === targetDateLabel)
    : null;

  if (chartData.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm"
        aria-label="No projection data"
      >
        {type === 'savings'
          ? 'Enter an amount per cycle or set a target date to see your projection'
          : 'Enter an amount per cycle or set a target date to see your payoff projection'}
      </div>
    );
  }

  const xAxisInterval =
    isNarrow && chartData.length > 4
      ? Math.floor(chartData.length / 4)
      : chartData.length > 18
        ? Math.floor(chartData.length / 12)
        : 0;

  return (
    <div className="h-64 w-full" aria-label={`${type} projection chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 28, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id={`forecast-grad-${gradientId.replace(/:/g, '-')}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            scale="point"
            interval={xAxisInterval}
            tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
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
            formatter={(value: number | undefined, name?: string) => {
              const label = name === 'balanceSuggested' ? 'Target-date plan' : 'Your amount';
              return value != null ? [`${symbol}${Number(value).toFixed(2)}`, label] : [null, label];
            }}
            labelFormatter={(_, payload) => {
              const p = payload[0]?.payload as ChartDataPoint | undefined;
              return p ? format(new Date(p.date), 'd MMM yyyy') : '';
            }}
            contentStyle={{
              backgroundColor: 'rgb(var(--popover))',
              color: 'rgb(var(--popover-foreground))',
              border: '1px solid rgb(var(--popover-foreground) / 0.2)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontSize: '14px',
            }}
            labelStyle={{
              color: 'rgb(var(--popover-foreground))',
              fontWeight: 600,
              marginBottom: 4,
            }}
            itemStyle={{
              color: 'rgb(var(--popover-foreground))',
            }}
          />
          {targetPoint && (
            <ReferenceLine
              x={targetPoint.date}
              stroke="rgb(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Target date', position: 'top', fontSize: 13 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            stroke={color}
            strokeWidth={2}
            fill={`url(#forecast-grad-${gradientId.replace(/:/g, '-')})`}
            name="balance"
          />
          {hasTwoLines && (
            <Line
              type="monotone"
              dataKey="balanceSuggested"
              stroke={REPAY_SUGGESTED_COLOR}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="balanceSuggested"
            />
          )}
          {hasTwoLines && (
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (value === 'balance' ? 'Your amount' : 'Target-date plan')}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
