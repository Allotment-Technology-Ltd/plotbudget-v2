'use client';

import { AlertTriangle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currencySymbol } from '@/lib/utils/currency';
import type { Database } from '@repo/supabase';

type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

export type BlueprintCategoryKey = 'need' | 'want' | 'savings' | 'repay';

interface CategorySummaryGridProps {
  paycycle: Paycycle;
  household: Household;
  onEditRatios?: () => void;
  /** When set, category cards act as multi-select filters; empty = show all sections. */
  selectedFilters?: BlueprintCategoryKey[];
  onFilterChange?: (filters: BlueprintCategoryKey[]) => void;
}

/** Border colour when selected — same 2px border, category colour (Tailwind needs full names for purge). */
const selectedBorderByType: Record<
  'needs' | 'wants' | 'savings' | 'repay',
  string
> = {
  needs: 'border-needs',
  wants: 'border-wants',
  savings: 'border-savings',
  repay: 'border-repay',
};

const categories = [
  {
    name: 'Needs',
    type: 'needs' as const,
    filterValue: 'need' as const,
    percentKey: 'needs_percent' as const,
    color: 'bg-needs',
    colorSubtle: 'bg-needs-subtle',
  },
  {
    name: 'Wants',
    type: 'wants' as const,
    filterValue: 'want' as const,
    percentKey: 'wants_percent' as const,
    color: 'bg-wants',
    colorSubtle: 'bg-wants-subtle',
  },
  {
    name: 'Savings',
    type: 'savings' as const,
    filterValue: 'savings' as const,
    percentKey: 'savings_percent' as const,
    color: 'bg-savings',
    colorSubtle: 'bg-savings-subtle',
  },
  {
    name: 'Repay',
    type: 'repay' as const,
    filterValue: 'repay' as const,
    percentKey: 'repay_percent' as const,
    color: 'bg-repay',
    colorSubtle: 'bg-repay-subtle',
  },
] as const;

export function CategorySummaryGrid({
  paycycle,
  household,
  onEditRatios,
  selectedFilters = [],
  onFilterChange,
}: CategorySummaryGridProps) {
  const totalIncome = Number(paycycle.total_income);
  const currency = household.currency || 'GBP';
  const isFilterable = typeof onFilterChange === 'function';
  const selectedSet = new Set(selectedFilters);

  const handleCardClick = (filterValue: BlueprintCategoryKey) => {
    if (!onFilterChange) return;
    const next = selectedSet.has(filterValue)
      ? selectedFilters.filter((f) => f !== filterValue)
      : [...selectedFilters, filterValue];
    onFilterChange(next);
  };

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
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
        role={isFilterable ? 'group' : undefined}
        aria-label={isFilterable ? 'Filter blueprint by category (select one or more)' : undefined}
      >
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
          const isSelected = isFilterable && selectedSet.has(cat.filterValue);

          const cardContent = (
            <>
              <div className="flex items-center gap-2 mb-2 sm:mb-3 shrink-0 min-w-0">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`}
                  aria-hidden
                />
                <h2
                  id={`category-${cat.type}-label`}
                  className="font-heading text-sm uppercase tracking-wider text-foreground truncate"
                >
                  {cat.name}
                </h2>
              </div>

              <div className="flex flex-col flex-1 min-w-0 min-h-0">
                <div className="min-h-[3.5rem] sm:min-h-[4rem] shrink-0 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-xl sm:text-2xl font-display text-foreground min-w-0 truncate">
                      {currencySymbol(currency)}{allocated.toFixed(2)}
                    </p>
                    {isOverAllocated && (
                      <AlertTriangle
                        className="h-5 w-5 shrink-0 text-warning flex-shrink-0"
                        aria-label="Over allocated"
                      />
                    )}
                  </div>
                  <p
                    className={`text-xs sm:text-sm break-words min-w-0 ${isOverAllocated ? 'text-warning' : 'text-muted-foreground'}`}
                  >
                    of {currencySymbol(currency)}{target.toFixed(2)} ({percent}%)
                    {isOverAllocated && (
                      <>
                        {' '}
                        <span className="block sm:inline">— Over budget</span>
                      </>
                    )}
                  </p>
                </div>

                <div
                  className="h-2 bg-muted rounded-full overflow-hidden mt-2 shrink-0 min-w-0"
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

                <p className="text-xs text-muted-foreground mt-2 shrink-0 min-w-0 break-words">
                  {currencySymbol(currency)}{remaining.toFixed(2)} remaining
                </p>
              </div>
            </>
          );

          const borderColor =
            isFilterable && isSelected
              ? selectedBorderByType[cat.type]
              : 'border-muted-foreground/50';

          const cardBaseClass = 'bg-card rounded-lg p-4 sm:p-6 border-2 flex flex-col text-left min-w-0 overflow-hidden';
          const cardInteractiveClass = `transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${borderColor} hover:border-foreground`;

          if (isFilterable) {
            return (
              <button
                key={cat.type}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-labelledby={`category-${cat.type}-label`}
                onClick={() => handleCardClick(cat.filterValue)}
                className={`${cardBaseClass} ${cardInteractiveClass}`}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <div
              key={cat.type}
              className={`${cardBaseClass} border-muted-foreground/50`}
              aria-labelledby={`category-${cat.type}-label`}
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}
