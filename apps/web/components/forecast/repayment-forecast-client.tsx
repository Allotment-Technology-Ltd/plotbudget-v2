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
  projectRepaymentOverTime,
  endDateFromCycles,
  cyclesToClearFromAmount,
} from '@/lib/utils/forecast-projection';
import { suggestedRepaymentAmount } from '@/lib/utils/suggested-amount';
import { currencySymbol, formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import type { Household, Repayment, PayCycle, Seed } from '@repo/supabase';

interface RepaymentForecastClientProps {
  repayment: Repayment;
  household: Household;
  paycycle: PayCycle | null;
  linkedSeed: Seed | null;
}

export function RepaymentForecastClient({
  repayment,
  household,
  paycycle,
  linkedSeed,
}: RepaymentForecastClientProps) {
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
  const currentBalance = Number(repayment.current_balance);
  const startingBalance = Number(repayment.starting_balance);
  const targetDateFromRep = repayment.target_date ?? null;
  const interestRate = repayment.interest_rate != null ? Number(repayment.interest_rate) : null;

  const suggestedAmount = useMemo(() => {
    if (!targetDateFromRep) return null;
    return suggestedRepaymentAmount(
      currentBalance,
      cycleStart,
      targetDateFromRep,
      config.payCycleType,
      config.payDay
    );
  }, [currentBalance, cycleStart, targetDateFromRep, config.payCycleType, config.payDay]);

  const [targetDate, setTargetDate] = useState(targetDateFromRep ?? '');
  const [amountStr, setAmountStr] = useState(
    linkedSeed ? String(linkedSeed.amount) : suggestedAmount != null ? String(suggestedAmount) : ''
  );
  const [includeInterest, setIncludeInterest] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const amount = parseFloat(amountStr) || 0;

  const projection = useMemo(() => {
    if (amount <= 0) return [];
    return projectRepaymentOverTime(
      currentBalance,
      amount,
      cycleStart,
      config,
      { includeInterest, interestRateAnnualPercent: interestRate }
    );
  }, [currentBalance, amount, cycleStart, config, includeInterest, interestRate]);

  const cyclesToClear = amount > 0 ? cyclesToClearFromAmount(currentBalance, amount) : 0;
  const payoffDate =
    cyclesToClear > 0 ? endDateFromCycles(cycleStart, cyclesToClear - 1, config) : null;

  const handleLockIn = async () => {
    if (amount <= 0) {
      toast.error('Enter a positive amount');
      return;
    }
    setIsLocking(true);
    const result = await lockInForecastAmount(
      null,
      repayment.id,
      amount,
      repayment.name,
      'repay'
    );
    setIsLocking(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Locked in ${formatCurrency(amount, currency)} per cycle`);
    router.refresh();
  };

  const progress =
    startingBalance > 0
      ? Math.min(100, ((startingBalance - currentBalance) / startingBalance) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-6 h-6 text-repay" aria-hidden />
          <h1 className="font-heading text-xl uppercase tracking-wider">{repayment.name}</h1>
        </div>
        <p className="text-muted-foreground mb-2">
          {symbol}{currentBalance.toFixed(2)} / {symbol}{startingBalance.toFixed(2)} remaining
        </p>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-repay rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="target-date">Target payoff date</Label>
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
                  onClick={() => setAmountStr(suggestedAmount.toFixed(2))}
                >
                  Use suggested
                </Button>
              )}
            </div>
          </div>
        </div>

        {interestRate != null && interestRate > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="include-interest"
              checked={includeInterest}
              onChange={(e) => setIncludeInterest(e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="include-interest" className="font-normal cursor-pointer">
              Include interest ({interestRate}% p.a.) in projection
            </Label>
          </div>
        )}

        {amount > 0 && currentBalance > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            Paying {formatCurrency(amount, currency)} per cycle → cleared in {cyclesToClear} cycle
            {cyclesToClear !== 1 ? 's' : ''}
            {payoffDate ? ` (by ${new Date(payoffDate).toLocaleDateString()})` : ''}
          </p>
        )}

        <div className="mt-6">
          <h2 className="font-heading text-sm uppercase tracking-wider mb-4">Projection</h2>
          <ForecastChart data={projection} type="repay" currency={currency} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={handleLockIn}
            disabled={amount <= 0 || isLocking}
            aria-busy={isLocking}
          >
            {isLocking
              ? 'Locking in…'
              : `Lock in ${formatCurrency(amount || 0, currency)} per cycle`}
          </Button>
          <Link href="/dashboard/blueprint">
            <Button variant="outline" type="button">
              Edit in Blueprint
            </Button>
          </Link>
        </div>

        <ForecastDisclaimer includeInterest={includeInterest} className="mt-6" />
      </div>
    </div>
  );
}
