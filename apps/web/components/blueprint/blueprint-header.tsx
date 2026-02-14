'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface PaycycleOption {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface PaidProgress {
  paid: number;
  total: number;
  percent: number;
}

interface BlueprintHeaderProps {
  paycycle: Paycycle;
  household: Household;
  allPaycycles: PaycycleOption[];
  onCycleChange: (cycleId: string) => void;
  onCreateNext?: () => void;
  onResyncDraft?: () => void;
  /** When viewing the active (current) cycle, show payment progress. Draft/archived do not. */
  paidProgress?: PaidProgress;
}

export function BlueprintHeader({
  paycycle,
  household: _household,
  allPaycycles,
  onCycleChange,
  onCreateNext,
  onResyncDraft,
  paidProgress,
}: BlueprintHeaderProps) {
  const startDate = format(new Date(paycycle.start_date), 'MMM d');
  const endDate = format(new Date(paycycle.end_date), 'MMM d, yyyy');
  const isActiveCycle = paycycle.status === 'active';
  const showProgress = isActiveCycle && paidProgress != null;

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="content-wrapper py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-[3.5rem] flex flex-col justify-center">
            <h1 className="font-heading text-headline-sm md:text-headline uppercase text-foreground">
              Your Blueprint
            </h1>

            <div className="mt-1 min-h-[1.5rem] flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span
                className="flex items-center gap-1"
                aria-label="Pay cycle dates"
              >
                <Calendar className="w-4 h-4" aria-hidden />
                {startDate} – {endDate}
              </span>
              {showProgress && (
                <span aria-label={`${paidProgress.paid} of ${paidProgress.total} bills paid`}>
                  {paidProgress.paid} of {paidProgress.total} bills paid (
                  {paidProgress.percent.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>

          <div
            className="flex flex-col gap-2 min-w-0 sm:flex-row sm:items-center sm:gap-3 sm:flex-nowrap sm:min-w-[320px] sm:justify-end"
            aria-label="Blueprint controls"
          >
            <Select
              value={paycycle.id}
              onValueChange={onCycleChange}
              aria-label="Select pay cycle"
            >
              <SelectTrigger className="w-full min-w-0 sm:min-w-[200px] sm:max-w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allPaycycles.map((cycle) => {
                  const dateLabel = cycle.name || format(new Date(cycle.start_date), 'MMM yyyy');
                  const statusLabel =
                    cycle.status === 'active'
                      ? 'Current cycle'
                      : cycle.status === 'draft'
                        ? 'Next cycle'
                        : dateLabel;
                  const displayLabel =
                    cycle.status === 'active' || cycle.status === 'draft'
                      ? statusLabel
                      : dateLabel;
                  return (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {displayLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {paycycle.status === 'active' && onCreateNext && (
              <Button
                variant="outline"
                className="w-full sm:w-auto px-4 py-2 text-sm shrink-0"
                onClick={onCreateNext}
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden />
                Create Next Cycle
              </Button>
            )}
            {paycycle.status === 'draft' && onResyncDraft && (
              <Button
                variant="outline"
                className="w-full sm:w-auto px-4 py-2 text-sm shrink-0"
                onClick={onResyncDraft}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden />
                Resync from current
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar: always reserve height so layout never jumps. Active = fill, draft/other = empty. */}
        <div
          className="mt-4 h-2 min-h-[8px]"
          role="region"
          aria-label="Payment progress"
        >
          {showProgress ? (
            <div
              role="progressbar"
              aria-valuenow={paidProgress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${paidProgress.paid} of ${paidProgress.total} bills paid`}
              className="h-2 bg-muted rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${paidProgress.percent}%` }}
              />
            </div>
          ) : (
            <div
              className="h-2 bg-muted rounded-full overflow-hidden"
              aria-hidden
            >
              <div className="h-full w-0" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
