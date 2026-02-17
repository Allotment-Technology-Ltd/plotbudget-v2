'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { currencySymbol } from '@/lib/utils/currency';
import { markPotComplete } from '@/lib/actions/pot-actions';
import { Button } from '@/components/ui/button';
import type { Pot, Repayment } from '@repo/supabase';

type PotStatus = 'active' | 'complete' | 'paused';

interface SavingsDebtProgressProps {
  pots: Pot[];
  repayments: Repayment[];
  currency?: 'GBP' | 'USD' | 'EUR';
}

export function SavingsDebtProgress({
  pots,
  repayments,
  currency = 'GBP',
}: SavingsDebtProgressProps) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, PotStatus>>({});

  const handleMarkPotComplete = async (potId: string, status: 'complete' | 'active') => {
    const pot = pots.find((p) => p.id === potId);
    const prevStatus = (pot?.status ?? 'active') as PotStatus;
    setOptimisticStatus((s) => ({ ...s, [potId]: status }));
    const result = await markPotComplete(potId, status);
    if ('success' in result) {
      router.refresh();
      setOptimisticStatus((s) => {
        const next = { ...s };
        delete next[potId];
        return next;
      });
    } else {
      setOptimisticStatus((s) => {
        const next = { ...s };
        next[potId] = prevStatus;
        return next;
      });
    }
  };
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
            const effectiveStatus = (optimisticStatus[pot.id] ?? pot.status) as PotStatus;
            const progress =
              pot.target_amount > 0
                ? Math.min(
                    100,
                    (pot.current_amount / pot.target_amount) * 100
                  )
                : 0;
            const status =
              effectiveStatus === 'complete'
                ? 'Accomplished'
                : effectiveStatus === 'paused'
                  ? 'Paused'
                  : 'Saving';
            const canToggle = effectiveStatus === 'active' || effectiveStatus === 'complete' || effectiveStatus === 'paused';
            const nextStatus = effectiveStatus === 'complete' ? 'active' : 'complete';
            return (
              <Link
                key={pot.id}
                href={`/dashboard/forecast/pot/${pot.id}`}
                className="block rounded-lg border border-border p-4 bg-background/50 hover:border-muted-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                role="article"
                aria-label={`${pot.name}: ${currencySymbol(currency)}${pot.current_amount} of ${currencySymbol(currency)}${pot.target_amount}, ${progress.toFixed(0)}%. View forecast`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden>
                      {pot.icon || '🏖️'}
                    </span>
                    <span className="font-heading text-sm uppercase tracking-wider truncate">
                      {pot.name}
                    </span>
                  </div>
                  {canToggle && (
                    <Button
                      variant="ghost"
                      className="shrink-0 text-xs h-7 px-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkPotComplete(pot.id, nextStatus);
                      }}
                      aria-label={effectiveStatus === 'complete' ? 'Mark as active' : 'Mark as accomplished'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {effectiveStatus === 'complete' ? 'Active' : 'Accomplished'}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {currencySymbol(currency)}{pot.current_amount.toFixed(2)} / {currencySymbol(currency)}
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
              </Link>
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
              <Link
                key={rep.id}
                href={`/dashboard/forecast/repayment/${rep.id}`}
                className="block rounded-lg border border-border p-4 bg-background/50 hover:border-muted-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                role="article"
                aria-label={`${rep.name}: ${currencySymbol(currency)}${rep.current_balance} remaining of ${currencySymbol(currency)}${rep.starting_balance}. View forecast`}
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
    </motion.section>
  );
}
