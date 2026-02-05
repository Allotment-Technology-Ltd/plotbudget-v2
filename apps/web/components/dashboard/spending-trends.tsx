'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { PayCycle } from '@/lib/supabase/database.types';

type HistoricalCycle = Pick<
  PayCycle,
  'id' | 'name' | 'start_date' | 'end_date' | 'total_income' | 'total_allocated'
>;

interface SpendingTrendsProps {
  currentCycle: PayCycle;
  historicalCycles: HistoricalCycle[];
}

function buildChartData(
  current: PayCycle,
  historical: HistoricalCycle[]
): { name: string; allocated: number; income: number }[] {
  const currentLabel =
    current.name ||
    `${format(new Date(current.start_date), 'MMM d')} – ${format(new Date(current.end_date), 'MMM d')}`;
  const currentPoint = {
    name: currentLabel,
    allocated: current.total_allocated,
    income: current.total_income,
  };

  const historicalPoints = historical.map((c) => ({
    name:
      c.name ||
      `${format(new Date(c.start_date), 'MMM d')} – ${format(new Date(c.end_date), 'MMM d')}`,
    allocated: c.total_allocated,
    income: c.total_income,
  }));

  return [...historicalPoints.reverse(), currentPoint];
}

export function SpendingTrends({
  currentCycle,
  historicalCycles,
}: SpendingTrendsProps) {
  const data = buildChartData(currentCycle, historicalCycles);

  if (data.length < 2) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Spending trends"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Spending Trends
        </h2>
        <p className="text-muted-foreground text-sm py-8 text-center">
          Complete more pay cycles to see trends over time.
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
      aria-label="Spending trends"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
        Spending Trends
      </h2>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          role="img"
          aria-label="Line chart comparing total allocated across last pay cycles"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'rgb(var(--border) / 0.3)' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null ? [`£${value.toFixed(2)}`, ''] : ['£0.00', '']
            }
            labelFormatter={(label) => label}
          />
          <Legend
            formatter={() => 'Total allocated'}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="allocated"
            name="Total allocated"
            stroke="rgb(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'rgb(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <table className="sr-only" aria-label="Spending trends data">
        <thead>
          <tr>
            <th>Cycle</th>
            <th>Total allocated</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>£{row.allocated.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.section>
  );
}
