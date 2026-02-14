'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle } from 'lucide-react';
import { currencySymbol } from '@/lib/utils/currency';
import type { Seed } from '@/lib/supabase/database.types';

interface UpcomingBillsProps {
  seeds: Seed[];
  currency?: 'GBP' | 'USD' | 'EUR';
}

const TYPE_LABELS: Record<Seed['type'], string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repay',
};

export function UpcomingBills({ seeds, currency = 'GBP' }: UpcomingBillsProps) {
  const unpaid = seeds.filter((s) => !s.is_paid);
  const displayList = unpaid.slice(0, 7);

  if (unpaid.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Upcoming bills"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Upcoming Bills
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle
            className="w-12 h-12 text-primary mb-3"
            aria-hidden
          />
          <p className="text-muted-foreground text-sm">
            All bills paid. Great job!
          </p>
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
      aria-label="Upcoming bills"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
        Upcoming Bills
      </h2>

      <ul className="space-y-3" aria-label="Unpaid bills">
        {displayList.map((seed) => (
          <li
            key={seed.id}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar
                className="w-4 h-4 text-muted-foreground flex-shrink-0"
                aria-hidden
              />
              <span className="text-sm font-body truncate">{seed.name}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <span className="text-xs text-muted-foreground">
                {TYPE_LABELS[seed.type]}
              </span>
              <span className="font-display text-sm">
                {currencySymbol(currency)}{seed.amount.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {unpaid.length > 7 && (
        <p className="text-xs text-muted-foreground mt-3">
          +{unpaid.length - 7} more unpaid
        </p>
      )}
    </motion.section>
  );
}
