'use client';

import { AlertTriangle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currencySymbol } from '@/lib/utils/currency';
import type { Database } from '@repo/supabase';

type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface CategorySummaryGridProps {
  paycycle: Paycycle;
  household: Household;
  onEditRatios?: () => void;
}

const categories = [
  {
    name: 'Needs',
    type: 'needs' as const,
    percentKey: 'needs_percent' as const,
    color: 'bg-needs',
    colorSubtle: 'bg-needs-subtle',
  },
  {
    name: 'Wants',
    type: 'wants' as const,
    percentKey: 'wants_percent' as const,
    color: 'bg-wants',
    colorSubtle: 'bg-wants-subtle',
  },
  {
    name: 'Savings',
    type: 'savings' as const,
    percentKey: 'savings_percent' as const,
    color: 'bg-savings',
    colorSubtle: 'bg-savings-subtle',
  },
  {
    name: 'Repay',
    type: 'repay' as const,
    percentKey: 'repay_percent' as const,
    color: 'bg-repay',
    colorSubtle: 'bg-repay-subtle',
  },
] as const;

export function CategorySummaryGrid({
  paycycle,
  household,
  onEditRatios,
}: CategorySummaryGridProps) {
  const totalIncome = Number(paycycle.total_income);
  const currency = household.currency || 'GBP';

  return (
    <div role="region" aria-label="Category budget summary">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground sr-only md:not-sr-only">
          Category allocation
        </h2>
        {onEditRatios && (
          <Button
            variant="ghost"
            className="px-3 py-1.5 h-auto text-sm"
            onClick={onEditRatios}
            aria-label="Edit category split percentages"
          >
            <Settings2 className="w-4 h-4 mr-2" aria-hidden />
            Edit split
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const percent = household[cat.percentKey] ?? 50;
        const target = totalIncome * (percent / 100);
        const allocated =
          Number(paycycle[`alloc_${cat.type}_me`]) +
          Number(paycycle[`alloc_${cat.type}_partner`]) +
          Number(paycycle[`alloc_${cat.type}_joint`]);
        const remaining =
          Number(paycycle[`rem_${cat.type}_me`]) +
          Number(paycycle[`rem_${cat.type}_partner`]) +
          Number(paycycle[`rem_${cat.type}_joint`]);
        const progress = target > 0 ? Math.min((allocated / target) * 100, 100) : 0;
        const isOverAllocated = target > 0 && allocated > target;

        return (
          <div
            key={cat.type}
            className={`bg-card rounded-lg p-6 border flex flex-col ${isOverAllocated ? 'border-warning/50' : 'border-border'}`}
            aria-labelledby={`category-${cat.type}-label`}
          >
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div
                className={`w-3 h-3 rounded-full ${cat.color}`}
                aria-hidden
              />
              <h2
                id={`category-${cat.type}-label`}
                className="font-heading text-sm uppercase tracking-wider text-foreground"
              >
                {cat.name}
              </h2>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="min-h-[4rem] shrink-0">
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-display text-foreground">
                    {currencySymbol(currency)}{allocated.toFixed(2)}
                  </p>
                  {isOverAllocated && (
                    <AlertTriangle
                      className="h-5 w-5 shrink-0 text-warning"
                      aria-label="Over allocated"
                    />
                  )}
                </div>
                <p
                  className={`text-sm ${isOverAllocated ? 'text-warning' : 'text-muted-foreground'}`}
                >
                  of {currencySymbol(currency)}{target.toFixed(2)} ({percent}%)
                  {isOverAllocated && ' — Over budget'}
                </p>
              </div>

              <div
                className="h-2 bg-muted rounded-full overflow-hidden mt-2 shrink-0"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.name} allocation progress`}
              >
                <div
                  className={`h-full ${cat.color} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-2 shrink-0">
                {currencySymbol(currency)}{remaining.toFixed(2)} remaining
              </p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
