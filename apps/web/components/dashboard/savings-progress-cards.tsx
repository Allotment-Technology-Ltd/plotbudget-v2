'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { currencySymbol } from '@/lib/utils/currency';
import type { Pot } from '@repo/supabase';

type PotStatus = 'active' | 'complete' | 'paused';

interface SavingsProgressCardsProps {
  pots: Pot[];
  currency?: 'GBP' | 'USD' | 'EUR';
  /** When true, omit the title row (used when section provides its own header) */
  hideTitle?: boolean;
}

export function SavingsProgressCards({
  pots,
  currency = 'GBP',
  hideTitle = false,
}: SavingsProgressCardsProps) {
  if (pots.length === 0) return null;

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl uppercase tracking-wider">Savings goals</h2>
          <Link
            href="/dashboard/blueprint"
            className="text-xs font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Manage
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {pots.map((pot, index) => {
          const potStatus = (pot.status ?? 'active') as PotStatus;
          const progress =
            pot.target_amount > 0
              ? Math.min(100, (pot.current_amount / pot.target_amount) * 100)
              : 0;
          const status =
            potStatus === 'complete'
              ? 'Accomplished'
              : potStatus === 'paused'
                ? 'Paused'
                : 'Saving';
          return (
            <Link
              key={pot.id}
              href={`/dashboard/forecast/pot/${pot.id}`}
              className="block min-h-[7.25rem] rounded-lg border border-border p-4 bg-background/50 hover:border-muted-foreground/30 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="article"
              aria-label={`${pot.name}: ${currencySymbol(currency)}${pot.current_amount} of ${currencySymbol(currency)}${pot.target_amount}, ${progress.toFixed(0)}%. View forecast`}
            >
              <div className="flex items-center gap-2 mb-2 min-h-6">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-base leading-none"
                  aria-hidden
                >
                  {pot.icon || '🏖️'}
                </span>
                <span className="font-heading text-sm uppercase tracking-wider truncate min-w-0">
                  {pot.name}
                </span>
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
      </div>
    </div>
  );
}
