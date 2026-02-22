'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForecastChart } from './forecast-chart';
import { ForecastDisclaimer } from './forecast-disclaimer';
import { ForecastLockedInfo } from './forecast-locked-info';
import { lockInForecastAmount } from '@/lib/actions/forecast-actions';
import { updateRepayment, deleteRepayment } from '@/lib/actions/repayment-actions';
import {
  projectRepaymentOverTime,
  projectSavingsOverTimeFixedCycles,
  endDateFromCycles,
  cyclesToClearFromAmount,
  getCycleEndDateForTarget,
  totalRepaymentCost,
} from '@/lib/utils/forecast-projection';
import { suggestedRepaymentAmount } from '@/lib/utils/suggested-amount';
import { currencySymbol, formatCurrency, parseIncome } from '@/lib/utils/currency';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const targetDateFromRep = repayment.target_date ?? null;

  const [currentBalanceStr, setCurrentBalanceStr] = useState(String(repayment.current_balance ?? 0));
  const [startingBalanceStr, setStartingBalanceStr] = useState(String(repayment.starting_balance ?? 0));
  useEffect(() => {
    queueMicrotask(() => {
      setCurrentBalanceStr(String(repayment.current_balance ?? 0));
      setStartingBalanceStr(String(repayment.starting_balance ?? 0));
    });
  }, [repayment.current_balance, repayment.starting_balance]);

  const parsedCurrent = parseIncome(currentBalanceStr);
  const parsedStarting = parseIncome(startingBalanceStr);
  const currentBalance = Number.isFinite(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : Number(repayment.current_balance ?? 0);
  const startingBalance = Number.isFinite(parsedStarting) && parsedStarting > 0 ? parsedStarting : Number(repayment.starting_balance ?? 0);

  const handleSaveRepaymentAmounts = async () => {
    const newCurrent = Number.isFinite(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : null;
    const newStarting = Number.isFinite(parsedStarting) && parsedStarting > 0 ? parsedStarting : null;
    const serverCurrent = Number(repayment.current_balance ?? 0);
    const serverStarting = Number(repayment.starting_balance ?? 0);
    const currentChanged = newCurrent !== null && newCurrent !== serverCurrent;
    const startingChanged = newStarting !== null && newStarting !== serverStarting;
    if (!currentChanged && !startingChanged) return;
    const updates: { current_balance?: number; starting_balance?: number } = {};
    if (currentChanged) updates.current_balance = newCurrent!;
    if (startingChanged) updates.starting_balance = newStarting!;
    const result = await updateRepayment(repayment.id, updates);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Amounts updated');
    router.refresh();
  };
  const [interestRateStr, setInterestRateStr] = useState(
    repayment.interest_rate != null ? String(repayment.interest_rate) : ''
  );
  useEffect(() => {
    queueMicrotask(() =>
      setInterestRateStr(
        repayment.interest_rate != null ? String(repayment.interest_rate) : ''
      )
    );
  }, [repayment.interest_rate]);
  const parsedInterest = parseFloat(interestRateStr);
  const interestRate =
    Number.isFinite(parsedInterest) && parsedInterest >= 0
      ? parsedInterest
      : repayment.interest_rate != null
        ? Number(repayment.interest_rate)
        : null;

  const handleSaveInterestRate = async () => {
    const val =
      Number.isFinite(parsedInterest) && parsedInterest >= 0 ? parsedInterest : null;
    const serverVal = repayment.interest_rate != null ? Number(repayment.interest_rate) : null;
    if (val === serverVal) return;
    const result = await updateRepayment(repayment.id, {
      interest_rate: val,
    });
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Interest rate updated');
    router.refresh();
  };

  const [targetDate, setTargetDate] = useState(targetDateFromRep ?? '');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const suggestedAmount = useMemo(() => {
    if (!targetDate) return null;
    return suggestedRepaymentAmount(
      currentBalance,
      cycleStart,
      targetDate,
      config.payCycleType,
      config.payDay
    );
  }, [currentBalance, cycleStart, targetDate, config.payCycleType, config.payDay]);
  const [amountStr, setAmountStr] = useState(
    linkedSeed ? String(linkedSeed.amount) : suggestedAmount != null ? String(suggestedAmount) : ''
  );
  const hasInterest = repayment.interest_rate != null && Number(repayment.interest_rate) > 0;

  useEffect(() => {
    if (linkedSeed && Number(linkedSeed.amount) > 0) {
      queueMicrotask(() => setAmountStr(String(linkedSeed.amount)));
    }
  }, [linkedSeed?.id, linkedSeed?.amount]);
  const [includeInterest, setIncludeInterest] = useState(hasInterest);
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

  const projectionSuggested = useMemo(() => {
    if (!targetDate || !suggestedAmount || suggestedAmount <= 0 || currentBalance <= 0) return [];
    return projectRepaymentOverTime(
      currentBalance,
      suggestedAmount,
      cycleStart,
      config,
      { includeInterest, interestRateAnnualPercent: interestRate }
    );
  }, [currentBalance, suggestedAmount, targetDate, cycleStart, config, includeInterest, interestRate]);

  const projectionFallback = useMemo(() => {
    if (projection.length > 0 || projectionSuggested.length > 0) return [];
    if (currentBalance <= 0) return [];
    return projectSavingsOverTimeFixedCycles(
      currentBalance,
      0,
      cycleStart,
      config,
      12
    );
  }, [currentBalance, cycleStart, config, projection, projectionSuggested]);

  const targetDateLabel = useMemo(() => {
    if (!targetDate) return null;
    const cycleEnd = getCycleEndDateForTarget(cycleStart, targetDate, config);
    return format(new Date(cycleEnd), 'MMM yyyy');
  }, [targetDate, cycleStart, config]);

  const cyclesToClear = amount > 0 ? cyclesToClearFromAmount(currentBalance, amount) : 0;
  const payoffDate =
    cyclesToClear > 0 ? endDateFromCycles(cycleStart, cyclesToClear - 1, config) : null;

  const costWithUserAmount = useMemo(() => {
    if (amount <= 0 || currentBalance <= 0) return null;
    return totalRepaymentCost(currentBalance, amount, cycleStart, config, {
      interestRateAnnualPercent: interestRate,
    });
  }, [currentBalance, amount, cycleStart, config, interestRate]);

  const costWithSuggestedAmount = useMemo(() => {
    if (!suggestedAmount || suggestedAmount <= 0 || currentBalance <= 0) return null;
    return totalRepaymentCost(currentBalance, suggestedAmount, cycleStart, config, {
      interestRateAnnualPercent: interestRate,
    });
  }, [currentBalance, suggestedAmount, cycleStart, config, interestRate]);

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
    if ('error' in result) {
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

  const handleRemoveDebt = async () => {
    setIsRemoving(true);
    const result = await deleteRepayment(repayment.id);
    setIsRemoving(false);
    setShowRemoveConfirm(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Debt removed');
    router.push('/dashboard/money');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-6 h-6 shrink-0 text-repay" aria-hidden />
            <h1 className="font-heading text-xl uppercase tracking-wider truncate">{repayment.name}</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive shrink-0 text-sm"
            onClick={() => setShowRemoveConfirm(true)}
          >
            Remove debt
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label htmlFor="repayment-current" className="text-xs text-muted-foreground">Current balance ({symbol})</Label>
            <Input
              id="repayment-current"
              type="text"
              inputMode="decimal"
              value={currentBalanceStr}
              onChange={(e) => setCurrentBalanceStr(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={handleSaveRepaymentAmounts}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repayment-starting" className="text-xs text-muted-foreground">Starting balance ({symbol})</Label>
            <Input
              id="repayment-starting"
              type="text"
              inputMode="decimal"
              value={startingBalanceStr}
              onChange={(e) => setStartingBalanceStr(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={handleSaveRepaymentAmounts}
            />
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-repay rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Set a target payoff date to get a suggested amount, or enter an amount to see when you’ll clear the debt.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="target-date" className="text-xs text-muted-foreground">Target payoff date</Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount per cycle ({symbol})</Label>
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
                  className="px-3 py-1.5 text-xs shrink-0"
                  onClick={() => setAmountStr(suggestedAmount.toFixed(2))}
                >
                  Use suggested
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          <div className="space-y-1.5">
            <Label htmlFor="repayment-interest" className="text-xs text-muted-foreground">
              Interest rate (% p.a.)
            </Label>
            <Input
              id="repayment-interest"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={interestRateStr}
              onChange={(e) =>
                setInterestRateStr(e.target.value.replace(/[^0-9.]/g, ''))
              }
              onBlur={handleSaveInterestRate}
            />
          </div>
        </div>
        {interestRate != null && interestRate > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="include-interest"
              checked={includeInterest}
              onChange={(e) => setIncludeInterest(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer shrink-0"
            />
            <Label htmlFor="include-interest" className="font-normal cursor-pointer">
              Include interest ({interestRate}% p.a.) in projection
            </Label>
          </div>
        )}

        {/* Projection summaries: outcome and interest comparison */}
        <div className="mt-6 space-y-4">
          <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
            Outcome summary
          </h2>
          <div
            className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2"
            role="region"
            aria-label="Forecast outcome"
          >
          {targetDate && suggestedAmount != null && (
            <p className="text-sm">
              <span className="text-muted-foreground">To clear by </span>
              <span className="font-semibold">
                {new Date(targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <span className="text-muted-foreground">: pay </span>
              <span className="font-semibold text-repay">
                {formatCurrency(suggestedAmount, currency)}
              </span>
              <span className="text-muted-foreground"> per cycle</span>
            </p>
          )}
          {amount > 0 && currentBalance > 0 && payoffDate && (
            <p className="text-sm">
              <span className="text-muted-foreground">At </span>
              <span className="font-semibold">{formatCurrency(amount, currency)}</span>
              <span className="text-muted-foreground"> per cycle: cleared by </span>
              <span className="font-semibold text-repay">
                {new Date(payoffDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            </p>
          )}
          {!targetDate && (amount <= 0 || currentBalance <= 0) && (
            <p className="text-sm text-muted-foreground">
              Set a target date or amount to see the outcome.
            </p>
          )}
          </div>

          {interestRate != null &&
          interestRate > 0 &&
          costWithUserAmount &&
          costWithSuggestedAmount &&
          amount > 0 &&
          suggestedAmount != null &&
          amount !== suggestedAmount && (
            <div
              className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2"
              role="region"
              aria-label="Interest comparison"
            >
              <p className="text-sm font-medium">Total paid with interest</p>
              <p className="text-sm text-muted-foreground">
                At {formatCurrency(amount, currency)}/cycle: {formatCurrency(costWithUserAmount.totalPaid, currency)}{' '}
                over {costWithUserAmount.cycles} cycle{costWithUserAmount.cycles !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                At {formatCurrency(suggestedAmount, currency)}/cycle: {formatCurrency(costWithSuggestedAmount.totalPaid, currency)}{' '}
                over {costWithSuggestedAmount.cycles} cycle{costWithSuggestedAmount.cycles !== 1 ? 's' : ''}
              </p>
              <p className="text-sm font-semibold">
                {costWithUserAmount.totalPaid < costWithSuggestedAmount.totalPaid ? (
                  <>
                    Overpaying saves {formatCurrency(costWithSuggestedAmount.totalPaid - costWithUserAmount.totalPaid, currency)}{' '}
                    in interest
                  </>
                ) : (
                  <>
                    Paying less adds {formatCurrency(costWithUserAmount.totalPaid - costWithSuggestedAmount.totalPaid, currency)}{' '}
                    in interest
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-heading text-sm uppercase tracking-wider mb-4">Projection</h2>
          <ForecastChart
            data={
              projection.length > 0
                ? projection
                : projectionSuggested.length > 0
                  ? projectionSuggested
                  : projectionFallback
            }
            type="repay"
            currency={currency}
            dataSuggested={
              projection.length > 0 && projectionSuggested.length > 0 ? projectionSuggested : null
            }
            targetDateLabel={targetDate ? targetDateLabel ?? undefined : undefined}
          />
        </div>

        <ForecastLockedInfo
          linkedSeed={linkedSeed}
          currency={currency}
          type="repay"
          className="mt-6"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handleLockIn}
            disabled={amount <= 0 || isLocking}
            aria-busy={isLocking}
          >
            {isLocking
              ? 'Locking in…'
              : `Lock in ${formatCurrency(amount || 0, currency)} per cycle`}
          </Button>
          <Link
            href={
              paycycle && linkedSeed
                ? `/dashboard/money/blueprint?cycle=${paycycle.id}&edit=${linkedSeed.id}`
                : paycycle
                  ? `/dashboard/money/blueprint?cycle=${paycycle.id}&editRepayment=${repayment.id}`
                  : '/dashboard/money/blueprint'
            }
          >
            <Button variant="outline" type="button">
              Edit in Blueprint
            </Button>
          </Link>
        </div>

        <ForecastDisclaimer includeInterest={includeInterest} className="mt-6" />
      </div>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove debt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{repayment.name}&quot; and unlink it from any bills in your blueprint. You can add a new debt anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveDebt();
              }}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
