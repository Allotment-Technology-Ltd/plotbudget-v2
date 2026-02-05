'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import type { Household, PayCycle } from '@/lib/supabase/database.types';

/** Category colors (hex) for chart - matches PLOT design tokens */
const CATEGORY_COLORS: Record<string, string> = {
  needs: '#8DA399',
  wants: '#C78D75',
  savings: '#6EC97C',
  repay: '#EF5350',
};

interface CategoryDonutChartProps {
  paycycle: PayCycle;
  household: Household;
  onCategorySelect?: (category: string) => void;
}

export function CategoryDonutChart({
  paycycle,
  onCategorySelect,
}: CategoryDonutChartProps) {
  const totalAllocated = paycycle.total_allocated || 1;

  const categories = [
    {
      name: 'Needs',
      key: 'needs',
      value:
        paycycle.alloc_needs_me +
        paycycle.alloc_needs_partner +
        paycycle.alloc_needs_joint,
      color: CATEGORY_COLORS.needs,
    },
    {
      name: 'Wants',
      key: 'wants',
      value:
        paycycle.alloc_wants_me +
        paycycle.alloc_wants_partner +
        paycycle.alloc_wants_joint,
      color: CATEGORY_COLORS.wants,
    },
    {
      name: 'Savings',
      key: 'savings',
      value:
        paycycle.alloc_savings_me +
        paycycle.alloc_savings_partner +
        paycycle.alloc_savings_joint,
      color: CATEGORY_COLORS.savings,
    },
    {
      name: 'Repay',
      key: 'repay',
      value:
        paycycle.alloc_repay_me +
        paycycle.alloc_repay_partner +
        paycycle.alloc_repay_joint,
      color: CATEGORY_COLORS.repay,
    },
  ].filter((cat) => cat.value > 0);

  if (categories.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Category breakdown"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Category Breakdown
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            No allocations yet. Add expenses in Blueprint to see your breakdown.
          </p>
          <a
            href="/dashboard/blueprint"
            className="text-primary font-heading text-sm uppercase tracking-wider hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Go to Blueprint
          </a>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Category breakdown"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
        Category Breakdown
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart role="img" aria-label="Donut chart of budget by category">
          <Pie
            data={categories}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            onClick={(entry: { key: string }) => onCategorySelect?.(entry.key)}
            className="cursor-pointer focus:outline-none"
          >
            {categories.map((entry) => (
              <Cell key={`cell-${entry.key}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null ? `£${Number(value).toFixed(2)}` : '£0.00'
            }
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => {
              const payload = entry.payload as { value?: number } | undefined;
              const val = payload?.value ?? 0;
              return (
                <span className="text-sm text-foreground">
                  {value}: £{val.toFixed(2)} (
                  {totalAllocated > 0
                    ? ((val / totalAllocated) * 100).toFixed(0)
                    : 0}
                  %)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Click segments to view category details
      </p>

      {/* Accessible data table alternative (visually hidden, for screen readers) */}
      <table className="sr-only" aria-label="Category breakdown data">
        <thead>
          <tr>
            <th>Category</th>
            <th>Amount</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.key}>
              <td>{cat.name}</td>
              <td>£{cat.value.toFixed(2)}</td>
              <td>{((cat.value / totalAllocated) * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.section>
  );
}
