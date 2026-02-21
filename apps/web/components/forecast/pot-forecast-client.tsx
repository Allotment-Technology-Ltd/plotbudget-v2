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
import { updatePot, deletePot } from '@/lib/actions/pot-actions';
import {
  projectSavingsOverTime,
  projectSavingsOverTimeFixedCycles,
  endDateFromCycles,
  cyclesToGoalFromAmount,
  getCycleEndDateForTarget,
} from '@/lib/utils/forecast-projection';
import { suggestedSavingsAmount, countPayCyclesUntil } from '@/lib/utils/suggested-amount';
import { currencySymbol, formatCurrency, parseIncome } from '@/lib/utils/currency';
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';
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
  const targetDateFromPot = pot.target_date ?? null;

  const [currentAmountStr, setCurrentAmountStr] = useState(String(pot.current_amount ?? 0));
  const [targetAmountStr, setTargetAmountStr] = useState(String(pot.target_amount ?? 0));
  useEffect(() => {
    queueMicrotask(() => {
      setCurrentAmountStr(String(pot.current_amount ?? 0));
      setTargetAmountStr(String(pot.target_amount ?? 0));
    });
  }, [pot.current_amount, pot.target_amount]);
  const parsedCurrent = parseIncome(currentAmountStr);
  const parsedTarget = parseIncome(targetAmountStr);
  const currentAmount = Number.isFinite(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : Number(pot.current_amount ?? 0);
  const targetAmount = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : Number(pot.target_amount ?? 0);

  const handleSavePotAmounts = async () => {
    const newCurrent = Number.isFinite(parsedCurrent) && parsedCurrent >= 0 ? parsedCurrent : null;
    const newTarget = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : null;
    const serverCurrent = Number(pot.current_amount ?? 0);
    const serverTarget = Number(pot.target_amount ?? 0);
    const currentChanged = newCurrent !== null && newCurrent !== serverCurrent;
    const targetChanged = newTarget !== null && newTarget !== serverTarget;
    if (!currentChanged && !targetChanged) return;
    const updates: { current_amount?: number; target_amount?: number } = {};
    if (currentChanged) updates.current_amount = newCurrent!;
    if (targetChanged) updates.target_amount = newTarget!;
    const result = await updatePot(pot.id, updates);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Amounts updated');
    router.refresh();
  };

  const [mode, setMode] = useState<'target' | 'project'>(
    targetDateFromPot ? 'target' : 'project'
  );
  const [targetDate, setTargetDate] = useState(targetDateFromPot ?? '');

  const suggestedAmount = useMemo(() => {
    if (!targetDate) return null;
    return suggestedSavingsAmount(
      currentAmount,
      targetAmount,
      cycleStart,
      targetDate,
      config.payCycleType,
      config.payDay
    );
  }, [currentAmount, targetAmount, cycleStart, targetDate, config.payCycleType, config.payDay]);

  const [amountStr, setAmountStr] = useState(
    linkedSeed ? String(linkedSeed.amount) : suggestedAmount != null ? String(suggestedAmount) : ''
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const defaultDateFrom = cycleStart;
  const defaultDateTo = format(addMonths(new Date(cycleStart), 12), 'yyyy-MM-dd');
  const [projectDateFrom, setProjectDateFrom] = useState(defaultDateFrom);
  const [projectDateTo, setProjectDateTo] = useState(defaultDateTo);
  const [isLocking, setIsLocking] = useState(false);

  const amount = parseFloat(amountStr) || 0;
  const remaining = targetAmount - currentAmount;

  const isTargetMode = mode === 'target';

  const projection = useMemo(() => {
    if (!isTargetMode) {
      const numCycles = Math.min(
        120,
        Math.max(1, countPayCyclesUntil(cycleStart, projectDateTo, config.payCycleType, config.payDay))
      );
      const fullProjection = projectSavingsOverTimeFixedCycles(
        currentAmount,
        amount,
        cycleStart,
        config,
        numCycles
      );
      return fullProjection.filter(
        (p) => p.cycleEnd >= projectDateFrom && p.cycleEnd <= projectDateTo
      );
    }
    if (amount <= 0) return [];
    return projectSavingsOverTime(
      currentAmount,
      targetAmount,
      amount,
      cycleStart,
      config
    );
  }, [currentAmount, targetAmount, amount, cycleStart, config, projectDateFrom, projectDateTo, isTargetMode]);

  const projectionSuggested = useMemo(() => {
    if (!isTargetMode || !targetDate || !suggestedAmount || suggestedAmount <= 0 || remaining <= 0) return [];
    return projectSavingsOverTime(
      currentAmount,
      targetAmount,
      suggestedAmount,
      cycleStart,
      config
    );
  }, [currentAmount, targetAmount, suggestedAmount, targetDate, cycleStart, config, remaining, isTargetMode]);

  const projectionFallback = useMemo(() => {
    if (projection.length > 0 || projectionSuggested.length > 0) return [];
    if (!isTargetMode) {
      const numCycles = Math.min(
        120,
        Math.max(1, countPayCyclesUntil(cycleStart, projectDateTo, config.payCycleType, config.payDay))
      );
      const fullProjection = projectSavingsOverTimeFixedCycles(
        currentAmount,
        0,
        cycleStart,
        config,
        numCycles
      );
      return fullProjection.filter(
        (p) => p.cycleEnd >= projectDateFrom && p.cycleEnd <= projectDateTo
      );
    }
    return [];
  }, [currentAmount, cycleStart, config, projection, projectionSuggested, isTargetMode, projectDateFrom, projectDateTo]);

  const targetDateLabel = useMemo(() => {
    if (!targetDate) return null;
    const cycleEnd = getCycleEndDateForTarget(cycleStart, targetDate, config);
    return format(new Date(cycleEnd), 'MMM yyyy');
  }, [targetDate, cycleStart, config]);

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
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success(`Locked in ${formatCurrency(amount, currency)} per cycle`);
    router.refresh();
  };

  const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

  const handleRemoveGoal = async () => {
    setIsRemoving(true);
    const result = await deletePot(pot.id);
    setIsRemoving(false);
    setShowRemoveConfirm(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Savings goal removed');
    router.push('/dashboard/money');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>
              {pot.icon || '🏖️'}
            </span>
            <h1 className="font-heading text-xl uppercase tracking-wider truncate">{pot.name}</h1>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive shrink-0 text-sm"
            onClick={() => setShowRemoveConfirm(true)}
          >
            Remove savings goal
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label htmlFor="pot-current" className="text-xs text-muted-foreground">Current amount ({symbol})</Label>
            <Input
              id="pot-current"
              type="text"
              inputMode="decimal"
              value={currentAmountStr}
              onChange={(e) => setCurrentAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={handleSavePotAmounts}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pot-target" className="text-xs text-muted-foreground">Target amount ({symbol})</Label>
            <Input
              id="pot-target"
              type="text"
              inputMode="decimal"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={handleSavePotAmounts}
            />
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-savings rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {isTargetMode
            ? 'Set a target date to get a suggested amount, or enter an amount to see when you\'ll reach your goal.'
            : 'Choose a date range and amount per cycle to see how much you\'d save over that period.'}
        </p>

        <div className="flex gap-2 mb-5" role="tablist" aria-label="Forecast mode">
          <button
            type="button"
            role="tab"
            aria-selected={isTargetMode}
            onClick={() => {
              setMode('target');
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isTargetMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Reach my goal by date
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isTargetMode}
            onClick={() => {
              setMode('project');
              setTargetDate('');
              setProjectDateFrom(defaultDateFrom);
              setProjectDateTo(defaultDateTo);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !isTargetMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            See what I&apos;d save over time
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {isTargetMode ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="target-date" className="text-xs text-muted-foreground">Target date</Label>
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
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="project-from" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="project-from"
                  type="date"
                  min={cycleStart}
                  max={projectDateTo}
                  value={projectDateFrom}
                  onChange={(e) => setProjectDateFrom(e.target.value)}
                  aria-label="Start date for projection"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-to" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="project-to"
                  type="date"
                  min={projectDateFrom || cycleStart}
                  value={projectDateTo}
                  onChange={(e) => setProjectDateTo(e.target.value)}
                  aria-label="End date for projection"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount per cycle ({symbol})</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
                />
              </div>
            </>
          )}
        </div>

        {/* Projection summaries: outcome */}
        <div className="mt-6 space-y-4">
          <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
            Outcome summary
          </h2>
          <div
            className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-2"
            role="region"
            aria-label="Forecast outcome"
          >
          {isTargetMode && targetDate && suggestedAmount != null && (
            <p className="text-sm">
              <span className="text-muted-foreground">To reach goal by </span>
              <span className="font-semibold">
                {new Date(targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
              <span className="text-muted-foreground">: save </span>
              <span className="font-semibold text-savings">
                {formatCurrency(suggestedAmount, currency)}
              </span>
              <span className="text-muted-foreground"> per cycle</span>
            </p>
          )}
          {isTargetMode && amount > 0 && remaining > 0 && goalDate && (
            <p className="text-sm">
              <span className="text-muted-foreground">At </span>
              <span className="font-semibold">{formatCurrency(amount, currency)}</span>
              <span className="text-muted-foreground"> per cycle: goal reached by </span>
              <span className="font-semibold text-savings">
                {new Date(goalDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            </p>
          )}
          {!isTargetMode && projectDateFrom && projectDateTo && projectDateFrom <= projectDateTo && amount > 0 && projection.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Saving </span>
              <span className="font-semibold">{formatCurrency(amount, currency)}</span>
              <span className="text-muted-foreground"> per cycle from </span>
              <span className="font-semibold">
                {format(new Date(projectDateFrom), 'MMM yyyy')}
              </span>
              <span className="text-muted-foreground"> to </span>
              <span className="font-semibold">
                {format(new Date(projectDateTo), 'MMM yyyy')}
              </span>
              <span className="text-muted-foreground">: you&apos;d have </span>
              <span className="font-semibold text-savings">
                {formatCurrency(projection[projection.length - 1]!.balance, currency)}
              </span>
            </p>
          )}
          {isTargetMode && !targetDate && (amount <= 0 || remaining <= 0) && (
            <p className="text-sm text-muted-foreground">
              Set a target date or amount to see the outcome.
            </p>
          )}
          {!isTargetMode && (!projectDateFrom || !projectDateTo || projectDateFrom > projectDateTo || amount <= 0) && (
            <p className="text-sm text-muted-foreground">
              Choose a date range and amount per cycle to see the outcome.
            </p>
          )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-heading text-sm uppercase tracking-wider mb-2">Projection</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isTargetMode
              ? 'Balance over time until your goal. Dotted line shows suggested amount to hit target date.'
              : 'Projected balance over time as you save each cycle.'}
          </p>
          <ForecastChart
            data={
              projection.length > 0
                ? projection
                : projectionSuggested.length > 0
                  ? projectionSuggested
                  : projectionFallback
            }
            type="savings"
            currency={currency}
            dataSuggested={
              isTargetMode && projection.length > 0 && projectionSuggested.length > 0
                ? projectionSuggested
                : null
            }
            targetDateLabel={isTargetMode && targetDate ? targetDateLabel ?? undefined : undefined}
          />
        </div>

        <ForecastLockedInfo
          linkedSeed={linkedSeed}
          currency={currency}
          type="savings"
          className="mt-6"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={handleLockIn}
            disabled={amount <= 0 || isLocking}
            aria-busy={isLocking}
          >
            {isLocking ? 'Locking in…' : `Lock in ${formatCurrency(amount || 0, currency)} per cycle`}
          </Button>
          <Link
            href={
              paycycle && linkedSeed
                ? `/dashboard/money/blueprint?cycle=${paycycle.id}&edit=${linkedSeed.id}`
                : paycycle
                  ? `/dashboard/money/blueprint?cycle=${paycycle.id}&editPot=${pot.id}`
                  : '/dashboard/money/blueprint'
            }
          >
            <Button variant="outline" type="button">
              Edit in Blueprint
            </Button>
          </Link>
        </div>

        <ForecastDisclaimer className="mt-6" />
      </div>

      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove savings goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{pot.name}&quot; and unlink it from any bills in your blueprint. You can add a new savings goal anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveGoal();
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
