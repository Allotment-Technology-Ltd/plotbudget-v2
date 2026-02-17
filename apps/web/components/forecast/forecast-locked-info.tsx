'use client';

import { formatCurrency } from '@/lib/utils/currency';
import { Lock } from 'lucide-react';
import type { Seed } from '@repo/supabase';

interface ForecastLockedInfoProps {
  linkedSeed: Seed | null;
  currency: 'GBP' | 'USD' | 'EUR';
  type: 'savings' | 'repay';
  className?: string;
}

export function ForecastLockedInfo({
  linkedSeed,
  currency,
  type,
  className = '',
}: ForecastLockedInfoProps) {
  const lockedAmount = linkedSeed && Number(linkedSeed.amount) > 0 ? Number(linkedSeed.amount) : null;
  const verb = type === 'savings' ? 'save' : 'pay';

  return (
    <div
      className={`rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2 ${className}`}
      role="region"
      aria-label="Locked amount and blueprint info"
    >
      <div className="flex items-center gap-2 text-sm">
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
        {lockedAmount != null ? (
          <p>
            <span className="text-muted-foreground">Currently locked for this cycle: </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(lockedAmount, currency)} per cycle
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">
            No amount locked yet. Lock in to add this {verb}ing to your blueprint.
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground pl-6">
        Locking in adds this amount to your blueprint for this cycle and it will recur in future
        cycles. You can change or remove it anytime in the Blueprint.
      </p>
    </div>
  );
}
