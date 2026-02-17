'use client';

import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import type { PayCycle } from '@repo/supabase';

interface DashboardHeaderProps {
  /** When showDateRange is true, used to render date range in subtitle */
  paycycle?: PayCycle | null;
  /** When true and paycycle is set, show pay cycle dates. Default true. */
  showDateRange?: boolean;
}

const DEFAULT_SUBTITLE = 'Your financial overview';

export function DashboardHeader({
  paycycle,
  showDateRange = true,
}: DashboardHeaderProps) {
  const dateRange =
    showDateRange && paycycle
      ? `${format(new Date(paycycle.start_date), 'MMM d')} – ${format(new Date(paycycle.end_date), 'MMM d, yyyy')}`
      : null;

  return (
    <header className="border-b border-border bg-card">
      <div className="content-wrapper py-6">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{DEFAULT_SUBTITLE}</span>
          {dateRange != null && (
            <span
              className="flex items-center gap-1"
              aria-label="Current pay cycle dates"
            >
              <Calendar className="w-4 h-4 shrink-0" aria-hidden />
              {dateRange}
            </span>
          )}
        </p>
      </div>
    </header>
  );
}
