'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForecastChart } from './forecast-chart';
import { ForecastDisclaimer } from './forecast-disclaimer';
import { lockInForecastAmount } from '@/lib/actions/forecast-actions';
import {
  projectSavingsOverTime,
  endDateFromCycles,
  cyclesToGoalFromAmount,
} from '@/lib/utils/forecast-projection';
import { suggestedSavingsAmount } from '@/lib/utils/suggested-amount';
import { currencySymbol, formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import type { Household, Pot, PayCycle, Seed } from '@repo/supabase';

interface PotForecastClientProps {
  pot: Pot;
  household: Household;
  paycycle: PayCycle | null;
  linkedSeed: Seed | null;
}

export function PotForecastClient({
  pot,
  household,
  paycycle,
  linkedSeed,
}: PotForecastClientProps) {
  const router = useRouter();
  const currency = (household.currency as 'GBP' | 'USD' | 'EUR') ?? 'GBP';
  const symbol = currencySymbol(currency);

  const config = useMemo(
    () => ({
      payCycleType: household.pay_cycle_type as 'specific_date' | 'last_working_day' | 'every_4_weeks',
      payDay: household.pay_day ?? undefined,
      anchorDate: household.pay_cycle_anchor,
    }),
    [household.pay_cycle_type, household.pay_day, household.pay_cycle_anchor]
  );

  const cycleStart = paycycle?.start_date ?? new Date().toISOString().slice(0, 10);
  const targetAmount = Number(pot.target_amount);
  const currentAmount = Number(pot.current_amount);
  const targetDateFromPot = pot.target_date ?? null;

  const suggestedAmount = useMemo(() => {
    if (!targetDateFromPot) return null;
    return suggestedSavingsAmount(
      currentAmount,
      targetAmount,
      cycleStart,
      targetDateFromPot,
      config.payCycleType,
      config.payDay
    );
  }, [currentAmount, targetAmount, cycleStart, targetDateFromPot, config.payCycleType, config.payDay]);

  const [targetDate, setTargetDate] = useState(targetDateFromPot ?? '');
  const [amountStr, setAmountStr] = useState(
    linkedSeed ? String(linkedSeed.amount) : suggestedAmount != null ? String(suggestedAmount) : ''
  );
  const [isLocking, setIsLocking] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const remaining = targetAmount - currentAmount;

  const projection = useMemo(() => {
    if (amount <= 0) return [];
    return projectSavingsOverTime(
      currentAmount,
      targetAmount,
      amount,
      cycleStart,
      config
    );
  }, [currentAmount, targetAmount, amount, cycleStart, config]);

  const cyclesToGoal = amount > 0 ? cyclesToGoalFromAmount(currentAmount, targetAmount, amount) : 0;
  const goalDate =
    cyclesToGoal > 0 ? endDateFromCycles(cycleStart, cyclesToGoal - 1, config) : null;

  const handleLockIn = async () => {
    if (amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    setIsLocking(true);
    const result = await lockInForecastAmount(pot.id, null, amount, pot.name, 'savings');
    setIsLocking(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Locked in ${formatCurrency(amount, currency)} per cycle`);
    router.refresh();
  };

  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl" aria-hidden>
            {pot.icon || '🏖️'}
          </span>
          <h1 className="font-heading text-xl uppercase tracking-wider">{pot.name}</h1>
        </div>
        <p className="text-muted-foreground mb-2">
          {symbol}{currentAmount.toFixed(2)} / {symbol}{targetAmount.toFixed(2)}
        </p>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-savings rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="target-date">Target date</Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount per cycle ({symbol})</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
              />
              {suggestedAmount != null && targetDate && (
                <Button
                  type="button"
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => {
                    setAmountStr(suggestedAmount.toFixed(2));
                  }}
                >
                  Use suggested
                </Button>
              )}
            </div>
          </div>
        </div>

        {amount > 0 && remaining > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Saving {formatCurrency(amount, currency)} per cycle → reach goal in{' '}
            {cyclesToGoal} cycle{cyclesToGoal !== 1 ? 's' : ''}
            {goalDate ? ` (by ${new Date(goalDate).toLocaleDateString()})` : ''}
          </p>
        )}

        <div className="mt-6">
          <h2 className="font-heading text-sm uppercase tracking-wider mb-4">Projection</h2>
          <ForecastChart data={projection} type="savings" currency={currency} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={handleLockIn}
            disabled={amount <= 0 || isLocking}
            aria-busy={isLocking}
          >
            {isLocking ? 'Locking in…' : `Lock in ${formatCurrency(amount || 0, currency)} per cycle`}
          </Button>
          <Link href="/dashboard/blueprint">
            <Button variant="outline" type="button">
              Edit in Blueprint
            </Button>
          </Link>
        </div>

        <ForecastDisclaimer className="mt-6" />
      </div>
    </div>
  );
}
