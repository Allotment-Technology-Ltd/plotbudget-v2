'use client';

import { format } from 'date-fns';
import { Banknote, Settings } from 'lucide-react';
import Link from 'next/link';
import type { IncomeEvent } from '@/lib/utils/income-projection';

interface IncomeThisCycleProps {
  /** Total income for the cycle (e.g. paycycle.total_income) */
  total: number;
  /** Individual income events in this cycle */
  events: IncomeEvent[];
}

export function IncomeThisCycle({ total, events }: IncomeThisCycleProps) {
  return (
    <section
      className="bg-card rounded-lg border border-border p-6 min-w-0"
      aria-label="Income this cycle"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 min-w-0">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground flex items-center gap-2 min-w-0">
          <Banknote className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">Income this cycle</span>
        </h2>
        <Link
          href="/dashboard/settings?tab=income"
          className="text-sm font-heading uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <Settings className="h-4 w-4" aria-hidden />
          Manage
        </Link>
      </div>
      <p className="text-2xl font-display text-foreground mb-4">
        £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
      </p>
      {events.length > 0 ? (
        <ul className="space-y-2 min-w-0" role="list">
          {events.map((evt, i) => (
            <li
              key={`${evt.date}-${evt.sourceName}-${i}`}
              className="flex justify-between items-baseline text-sm gap-2 min-w-0"
            >
              <span className="text-foreground min-w-0 truncate" title={evt.sourceName}>{evt.sourceName}</span>
              <span className="text-muted-foreground shrink-0 font-body">
                £{evt.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}{' '}
                on {format(new Date(evt.date), 'd MMM')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground min-w-0 break-words">
          Add income sources in Settings → Income to see pay dates here.
        </p>
      )}
    </section>
  );
}
