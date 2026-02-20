'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { currencySymbol } from '@/lib/utils/currency';
import type { Repayment } from '@repo/supabase';

interface RepaymentProgressCardsProps {
  repayments: Repayment[];
  currency?: 'GBP' | 'USD' | 'EUR';
  /** When true, omit the title row (used when section provides its own header) */
  hideTitle?: boolean;
}

export function RepaymentProgressCards({
  repayments,
  currency = 'GBP',
  hideTitle = false,
}: RepaymentProgressCardsProps) {
  if (repayments.length === 0) return null;

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wider">Debt progress</h2>
          <Link
            href="/dashboard/blueprint"
            className="text-xs font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Manage
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {repayments.map((rep, index) => {
          const paid = rep.starting_balance - rep.current_balance;
          const progress =
            rep.starting_balance > 0
              ? Math.min(100, (paid / rep.starting_balance) * 100)
              : 0;
          const status =
            rep.status === 'paid'
              ? 'Cleared'
              : rep.status === 'paused'
                ? 'Paused'
                : 'Clearing';
          return (
            <Link
              key={rep.id}
              href={`/dashboard/forecast/repayment/${rep.id}`}
              className="block min-h-[7.25rem] rounded-lg border border-border p-4 bg-background/50 hover:border-muted-foreground/30 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="article"
              aria-label={`${rep.name}: ${currencySymbol(currency)}${rep.current_balance} remaining of ${currencySymbol(currency)}${rep.starting_balance}. View forecast`}
            >
              <div className="flex items-center gap-2 mb-2 min-h-6">
                <CreditCard className="h-6 w-6 shrink-0 text-repay" aria-hidden />
                <span className="font-heading text-sm uppercase tracking-wider truncate min-w-0">
                  {rep.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {currencySymbol(currency)}{rep.current_balance.toFixed(2)} / {currencySymbol(currency)}
                {rep.starting_balance.toFixed(2)}
              </p>
              <div
                className="h-2 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <motion.div
                  className="h-full bg-repay rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(0)}% — {status}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
