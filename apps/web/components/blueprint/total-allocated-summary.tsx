'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { currencySymbol } from '@/lib/utils/currency';
import type { Database } from '@repo/supabase';

type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface TotalAllocatedSummaryProps {
  paycycle: Paycycle;
  household: Household;
}

export function TotalAllocatedSummary({ paycycle, household }: TotalAllocatedSummaryProps) {
  const totalIncome = Number(paycycle.total_income);
  const totalAllocated = Number(paycycle.total_allocated);
  const difference = totalIncome - totalAllocated;
  const currency = household.currency || 'GBP';

  return (
    <section
      className="bg-card rounded-lg p-6 border border-border"
      aria-labelledby="total-allocated-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2
          id="total-allocated-heading"
          className="font-heading text-sm uppercase tracking-wider text-muted-foreground"
        >
          Total allocated
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl text-foreground">
            {currencySymbol(currency)}{totalAllocated.toFixed(2)}
          </span>
          <span className="text-muted-foreground">of</span>
          <span className="font-display text-xl text-foreground">
            {currencySymbol(currency)}{totalIncome.toFixed(2)}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 text-sm font-medium ${
            difference > 0
              ? 'text-primary'
              : difference < 0
                ? 'text-warning'
                : 'text-muted-foreground'
          }`}
        >
          {difference > 0 ? (
            <>
              <TrendingDown className="w-4 h-4" aria-hidden />
              {currencySymbol(currency)}{difference.toFixed(2)} under
            </>
          ) : difference < 0 ? (
            <>
              <TrendingUp className="w-4 h-4" aria-hidden />
              {currencySymbol(currency)}{Math.abs(difference).toFixed(2)} over
            </>
          ) : (
            <>
              <Minus className="w-4 h-4" aria-hidden />
              Fully allocated
            </>
          )}
        </div>
      </div>
    </section>
  );
}
