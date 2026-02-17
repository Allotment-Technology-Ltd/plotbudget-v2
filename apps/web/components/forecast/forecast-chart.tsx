'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { currencySymbol } from '@/lib/utils/currency';
import type { ProjectionPoint } from '@/lib/utils/forecast-projection';

const SAVINGS_COLOR = '#6EC97C';
const REPAY_COLOR = '#EF5350';

interface ForecastChartProps {
  data: ProjectionPoint[];
  type: 'savings' | 'repay';
  currency?: 'GBP' | 'USD' | 'EUR';
}

export function ForecastChart({
  data,
  type,
  currency = 'GBP',
}: ForecastChartProps) {
  const color = type === 'savings' ? SAVINGS_COLOR : REPAY_COLOR;
  const symbol = currencySymbol(currency);

  const chartData = data.map((p) => ({
    ...p,
    label: format(new Date(p.date), 'MMM yyyy'),
  }));

  if (chartData.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm"
        aria-label="No projection data"
      >
        Set a target date and amount to see your projection
      </div>
    );
  }

  return (
    <div className="h-64 w-full" aria-label={`${type} projection chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="forecastGradient"
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
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${symbol}${v}`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null ? [`${symbol}${value.toFixed(2)}`, 'Balance'] : [`${symbol}0.00`, 'Balance']
            }
            labelFormatter={(_, payload) => {
              const p = payload[0]?.payload as ProjectionPoint | undefined;
              return p ? format(new Date(p.date), 'd MMM yyyy') : '';
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={color}
            strokeWidth={2}
            fill="url(#forecastGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
