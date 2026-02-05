'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import type { Pot, Repayment } from '@/lib/supabase/database.types';

interface SavingsDebtProgressProps {
  pots: Pot[];
  repayments: Repayment[];
}

export function SavingsDebtProgress({
  pots,
  repayments,
}: SavingsDebtProgressProps) {
  const hasPots = pots.length > 0;
  const hasRepayments = repayments.length > 0;

  if (!hasPots && !hasRepayments) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Savings and debt progress"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Savings & Debt
        </h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-4">
            No savings goals or debts yet. Add them in Blueprint to track
            progress.
          </p>
          <Link
            href="/dashboard/blueprint"
            className="text-primary font-heading text-sm uppercase tracking-wider hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Manage Blueprint
          </Link>
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
      aria-label="Savings and debt progress"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          Savings & Debt
        </h2>
        <Link
          href="/dashboard/blueprint"
          className="text-xs font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Manage
        </Link>
      </div>

      <div className="space-y-6">
        {hasPots &&
          pots.map((pot, index) => {
            const progress =
              pot.target_amount > 0
                ? Math.min(
                    100,
                    (pot.current_amount / pot.target_amount) * 100
                  )
                : 0;
            const status =
              pot.status === 'complete'
                ? 'Accomplished'
                : pot.status === 'paused'
                  ? 'Paused'
                  : 'Saving';
            return (
              <div
                key={pot.id}
                className="rounded-lg border border-border p-4 bg-background/50"
                role="article"
                aria-label={`${pot.name}: £${pot.current_amount} of £${pot.target_amount}, ${progress.toFixed(0)}%`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg" aria-hidden>
                    {pot.icon || '🏖️'}
                  </span>
                  <span className="font-heading text-sm uppercase tracking-wider">
                    {pot.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  £{pot.current_amount.toFixed(2)} / £
                  {pot.target_amount.toFixed(2)}
                </p>
                <div
                  className="h-2 bg-muted rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <motion.div
                    className="h-full bg-savings rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.toFixed(0)}% — {status}
                </p>
              </div>
            );
          })}

        {hasRepayments &&
          repayments.map((rep, index) => {
            const paid = rep.starting_balance - rep.current_balance;
            const progress =
              rep.starting_balance > 0
                ? Math.min(
                    100,
                    (paid / rep.starting_balance) * 100
                  )
                : 0;
            const status =
              rep.status === 'paid'
                ? 'Cleared'
                : rep.status === 'paused'
                  ? 'Paused'
                  : 'Clearing';
            return (
              <div
                key={rep.id}
                className="rounded-lg border border-border p-4 bg-background/50"
                role="article"
                aria-label={`${rep.name}: £${rep.current_balance} remaining of £${rep.starting_balance}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard
                    className="w-4 h-4 text-repay"
                    aria-hidden
                  />
                  <span className="font-heading text-sm uppercase tracking-wider">
                    {rep.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  £{rep.current_balance.toFixed(2)} / £
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
              </div>
            );
          })}
      </div>
    </motion.section>
  );
}
