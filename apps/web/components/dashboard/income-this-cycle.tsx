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
      className="bg-card rounded-lg border border-border p-6"
      aria-label="Income this cycle"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground flex items-center gap-2">
          <Banknote className="h-5 w-5 text-muted-foreground" aria-hidden />
          Income this cycle
        </h2>
        <Link
          href="/dashboard/settings?tab=income"
          className="text-sm font-heading uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
        >
          <Settings className="h-4 w-4" aria-hidden />
          Manage
        </Link>
      </div>
      <p className="text-2xl font-display text-foreground mb-4">
        £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
      </p>
      {events.length > 0 ? (
        <ul className="space-y-2" role="list">
          {events.map((evt, i) => (
            <li
              key={`${evt.date}-${evt.sourceName}-${i}`}
              className="flex justify-between items-baseline text-sm"
            >
              <span className="text-foreground">{evt.sourceName}</span>
              <span className="text-muted-foreground">
                £{evt.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}{' '}
                <span className="font-body">
                  on {format(new Date(evt.date), 'd MMM')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add income sources in Settings → Income to see pay dates here.
        </p>
      )}
    </section>
  );
}
