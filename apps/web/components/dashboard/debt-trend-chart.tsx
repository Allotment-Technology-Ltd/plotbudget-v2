'use client';

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts';
import { currencySymbol, formatCurrency } from '@/lib/utils/currency';
import { projectRepaymentOverTime } from '@/lib/utils/forecast-projection';
import type { PayCycleConfig } from '@/lib/utils/forecast-projection';
import type { PayCycle, Repayment, Seed } from '@repo/supabase';

type HistoricalCycle = Pick<
  PayCycle,
  | 'id'
  | 'name'
  | 'start_date'
  | 'end_date'
  | 'alloc_repay_me'
  | 'alloc_repay_partner'
  | 'alloc_repay_joint'
>;

function getRepayAmount(cycle: HistoricalCycle | PayCycle): number {
  const row = cycle as Record<string, unknown>;
  const me = (row.alloc_repay_me as number) ?? 0;
  const partner = (row.alloc_repay_partner as number) ?? 0;
  const joint = (row.alloc_repay_joint as number) ?? 0;
  return (Number.isFinite(me) ? me : 0) + (Number.isFinite(partner) ? partner : 0) + (Number.isFinite(joint) ? joint : 0);
}

/** Config derived from household for pay cycle projection */
type HouseholdConfig = {
  pay_cycle_type: string;
  pay_day: number | null;
  anchor_date: string | null;
};

interface DebtTrendChartProps {
  currentCycle: PayCycle | null;
  historicalCycles: HistoricalCycle[];
  repayments: Repayment[];
  /** Seeds for current paycycle; used to resolve locked-in repay amounts per debt */
  seeds?: Seed[];
  /** Household pay cycle config for projecting future cycles */
  householdConfig?: HouseholdConfig | null;
  currency?: 'GBP' | 'USD' | 'EUR';
}

const DEBT_PALETTE = [
  '#EF5350',
  '#EC407A',
  '#AB47BC',
  '#7E57C2',
  '#5C6BC0',
  '#42A5F5',
  '#29B6F6',
  '#26C6DA',
  '#26A69A',
  '#66BB6A',
] as const;

function debtDataKey(id: string) {
  return `debt_${id}`;
}

export function DebtTrendChart({
  currentCycle,
  historicalCycles,
  repayments,
  seeds = [],
  householdConfig,
  currency = 'GBP',
}: DebtTrendChartProps) {
  const symbol = currencySymbol(currency);
  const hasDebts = repayments.length > 0;
  const totalCurrentDebt = repayments.reduce(
    (sum, r) => sum + Number(r.current_balance ?? 0),
    0
  );

  const cycles = [...historicalCycles].reverse();
  if (currentCycle) cycles.push(currentCycle as HistoricalCycle);

  /** Locked-in amount per repayment from seeds (sum if multiple seeds per debt) */
  const repayAmountByRepaymentId = new Map<string, number>();
  for (const s of seeds) {
    if (s.type === 'repay' && s.linked_repayment_id) {
      const amt = Number(s.amount ?? 0);
      repayAmountByRepaymentId.set(
        s.linked_repayment_id,
        (repayAmountByRepaymentId.get(s.linked_repayment_id) ?? 0) + amt
      );
    }
  }

  const canProject =
    hasDebts &&
    currentCycle &&
    householdConfig?.pay_cycle_type &&
    repayments.some(
      (r) =>
        Number(r.current_balance ?? 0) > 0 &&
        (repayAmountByRepaymentId.get(r.id) ?? 0) > 0
    );

  const payConfig: PayCycleConfig | null =
    householdConfig?.pay_cycle_type &&
    (householdConfig.pay_cycle_type === 'specific_date' ||
      householdConfig.pay_cycle_type === 'last_working_day' ||
      householdConfig.pay_cycle_type === 'every_4_weeks')
      ? {
          payCycleType: householdConfig.pay_cycle_type,
          payDay: householdConfig.pay_day ?? undefined,
          anchorDate: householdConfig.anchor_date ?? undefined,
        }
      : null;

  const projectedPoints: {
    label: string;
    cumulativeRepaid: number;
    isProjected?: boolean;
    [key: string]: unknown;
  }[] = [];

  if (canProject && payConfig) {
    const projections = repayments.map((r) => {
      const balance = Number(r.current_balance ?? 0);
      const amountPerCycle = repayAmountByRepaymentId.get(r.id) ?? 0;
      const interest =
        r.interest_rate != null && Number(r.interest_rate) > 0
          ? Number(r.interest_rate)
          : undefined;
      return projectRepaymentOverTime(
        balance,
        amountPerCycle,
        currentCycle!.start_date,
        payConfig,
        {
          includeInterest: !!interest,
          interestRateAnnualPercent: interest ?? null,
          maxCycles: 36,
        }
      );
    });

    const maxLen = Math.max(
      ...projections.map((p) => p.length),
      1
    );

    for (let i = 0; i < maxLen; i++) {
      let totalPaidSoFar = 0;
      const point: (typeof projectedPoints)[0] = {
        label: projections[0]?.[i]
          ? format(new Date(projections[0]![i]!.date), 'MMM yyyy')
          : `Cycle ${i + 1}`,
        cumulativeRepaid: 0,
        isProjected: true,
      };
      for (let r = 0; r < repayments.length; r++) {
        const pts = projections[r]!;
        const curr = pts[i];
        const startBalance = Number(repayments[r]!.current_balance ?? 0);
        const balance = curr ? curr.balance : 0;
        point[debtDataKey(repayments[r]!.id)] = balance;
        totalPaidSoFar += Math.max(0, startBalance - balance);
      }
      point.cumulativeRepaid = totalPaidSoFar;
      projectedPoints.push(point);
    }
  }

  const hasHistoricalData = cycles.length >= 2;
  const hasProjectedData = projectedPoints.length > 0;
  const showChart = hasDebts && (hasHistoricalData || hasProjectedData);

  if (!showChart) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Payoff trajectory"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-2">
          Payoff trajectory
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Remaining debt over time. Stacked areas show each debt; projection based on locked-in repayment amounts.
        </p>
        <div className="h-48 flex items-center justify-center rounded-lg border border-border bg-muted/20 text-muted-foreground text-sm">
          {!hasDebts
            ? 'Add debts in Blueprint to see trends.'
            : hasProjectedData
              ? null
              : 'Lock in repayment amounts in Blueprint to see your projected payoff trajectory.'}
        </div>
      </motion.section>
    );
  }

  const totalToProportion = totalCurrentDebt > 0
    ? repayments.reduce((acc, r) => {
        acc[r.id] = Number(r.current_balance ?? 0) / totalCurrentDebt;
        return acc;
      }, {} as Record<string, number>)
    : {};

  type ChartPoint = {
    cycleId?: string;
    label: string;
    repayAmount?: number;
    cumulativeRepaid: number;
    [key: string]: unknown;
  };

  let chartData: ChartPoint[] = [];

  if (hasHistoricalData) {
    let cumulative = 0;
    const historicalData: ChartPoint[] = cycles.map((c) => {
      const repayAmount = getRepayAmount(c);
      cumulative += repayAmount;
      return {
        cycleId: c.id,
        label:
          c.name ||
          `${format(new Date(c.start_date), 'MMM d')} – ${format(new Date(c.end_date), 'MMM d')}`,
        repayAmount,
        cumulativeRepaid: cumulative,
      };
    });

    let remaining = totalCurrentDebt;
    for (let i = historicalData.length - 1; i >= 0; i--) {
      const c = historicalData[i]!;
      repayments.forEach((r) => {
        (c as Record<string, unknown>)[debtDataKey(r.id)] =
          totalCurrentDebt > 0 ? remaining * (totalToProportion[r.id] ?? 0) : 0;
      });
      if (i > 0) {
        const nextRepay = historicalData[i]!.repayAmount ?? 0;
        remaining = Math.max(0, remaining + nextRepay);
      }
    }
    chartData = historicalData;
  }

  if (hasProjectedData) {
    const baseCumulative = chartData.length > 0 ? (chartData[chartData.length - 1]!.cumulativeRepaid as number) : 0;
    const projectedWithBase = projectedPoints.map((p) => ({
      ...p,
      cumulativeRepaid: baseCumulative + p.cumulativeRepaid,
      isProjected: true,
    }));
    if (chartData.length === 0) {
      const nowPoint: ChartPoint = {
        label: 'Now',
        cumulativeRepaid: 0,
      };
      repayments.forEach((r) => {
        (nowPoint as Record<string, unknown>)[debtDataKey(r.id)] = Number(r.current_balance ?? 0);
      });
      chartData = [nowPoint, ...projectedWithBase];
    } else {
      chartData = [...chartData, ...projectedWithBase];
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Payoff trajectory"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-2">
        Payoff trajectory
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {hasProjectedData
          ? 'Remaining debt over time. Stacked areas show each debt; projection based on locked-in amounts.'
          : 'Remaining debt over time. Stacked areas show each debt.'}
      </p>

      <div className="h-64 w-full" aria-label="Payoff trajectory chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              {repayments.map((r, i) => (
                <linearGradient
                  key={r.id}
                  id={`debtGradient-${r.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={DEBT_PALETTE[i % DEBT_PALETTE.length]} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={DEBT_PALETTE[i % DEBT_PALETTE.length]} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              scale="point"
              interval={chartData.length > 6 ? Math.floor(chartData.length / 6) : 0}
            />
            <YAxis
              tickFormatter={(v) => `${symbol}${v}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              formatter={(value: number | undefined, name?: string) => {
                const repayment = repayments.find((r) => debtDataKey(r.id) === name);
                return [value != null ? formatCurrency(value, currency) : '–', repayment?.name ?? name];
              }}
              labelFormatter={(_, payload) => {
                const p = payload[0]?.payload as ChartPoint;
                return p?.label ?? '';
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
            />
            {repayments.map((r, i) => (
              <Area
                key={r.id}
                type="monotone"
                dataKey={debtDataKey(r.id)}
                stackId="debt"
                stroke={DEBT_PALETTE[i % DEBT_PALETTE.length]}
                strokeWidth={1}
                fill={`url(#debtGradient-${r.id})`}
                name={debtDataKey(r.id)}
              />
            ))}
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => {
                const repayment = repayments.find((r) => debtDataKey(r.id) === value);
                return repayment?.name ?? value;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
