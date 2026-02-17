/**
 * Hook for repayment forecast projection, suggestions, and lock-in.
 * Separates domain logic from UI.
 */

import { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
  projectRepaymentOverTime,
  suggestedRepaymentAmount,
  endDateFromCycles,
  cyclesToClearFromAmount,
  type PayCycleConfig,
} from '@/lib/forecast-projection';
import { lockInForecastApi } from '@/lib/forecast-api';
import { hapticImpact } from '@/lib/haptics';
import type { Repayment, Household, PayCycle, Seed } from '@repo/supabase';

export interface UseRepaymentForecastParams {
  repayment: Repayment;
  household: Household | null;
  paycycle: PayCycle | null;
  linkedSeed: Seed | null;
  onLockInSuccess?: () => void;
}

export function useRepaymentForecast({
  repayment,
  household,
  paycycle,
  linkedSeed,
  onLockInSuccess,
}: UseRepaymentForecastParams) {
  const config = useMemo<PayCycleConfig>(
    () => ({
      payCycleType: (household?.pay_cycle_type ?? 'specific_date') as
        | 'specific_date'
        | 'last_working_day'
        | 'every_4_weeks',
      payDay: household?.pay_day ?? undefined,
      anchorDate: household?.pay_cycle_anchor,
    }),
    [household?.pay_cycle_type, household?.pay_day, household?.pay_cycle_anchor]
  );

  const cycleStart =
    paycycle?.start_date ?? new Date().toISOString().slice(0, 10);
  const currentBalance = Number(repayment.current_balance);
  const startingBalance = Number(repayment.starting_balance);
  const targetDateFromRep = repayment.target_date ?? null;
  const interestRate =
    repayment.interest_rate != null ? Number(repayment.interest_rate) : null;

  const [targetDate, setTargetDate] = useState(targetDateFromRep ?? '');

  const suggestedAmount = useMemo(() => {
    if (!targetDate) return null;
    return suggestedRepaymentAmount(
      currentBalance,
      cycleStart,
      targetDate,
      config.payCycleType
    );
  }, [currentBalance, cycleStart, targetDate, config.payCycleType]);
  const [amountStr, setAmountStr] = useState(
    linkedSeed
      ? String(linkedSeed.amount)
      : suggestedAmount != null
        ? String(suggestedAmount)
        : ''
  );
  const [includeInterest, setIncludeInterest] = useState(false);
  const [locking, setLocking] = useState(false);

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
  }, [
    currentBalance,
    amount,
    cycleStart,
    config,
    includeInterest,
    interestRate,
  ]);

  const cyclesToClear =
    amount > 0 ? cyclesToClearFromAmount(currentBalance, amount) : 0;
  const payoffDate =
    cyclesToClear > 0
      ? endDateFromCycles(cycleStart, cyclesToClear - 1, config)
      : null;

  const progress =
    startingBalance > 0
      ? Math.min(
          100,
          ((startingBalance - currentBalance) / startingBalance) * 100
        )
      : 0;

  const handleLockIn = useCallback(async () => {
    if (amount <= 0) return;
    hapticImpact('medium');
    setLocking(true);
    const result = await lockInForecastApi({
      potId: null,
      repaymentId: repayment.id,
      amount,
      name: repayment.name,
      type: 'repay',
    });
    setLocking(false);
    if ('success' in result && result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLockInSuccess?.();
    }
  }, [amount, repayment.id, repayment.name, onLockInSuccess]);

  const handleUseSuggested = useCallback(() => {
    if (suggestedAmount != null) {
      hapticImpact('light');
      setAmountStr(suggestedAmount.toFixed(2));
    }
  }, [suggestedAmount]);

  const handleToggleInterest = useCallback(() => {
    hapticImpact('light');
    setIncludeInterest((prev) => !prev);
  }, []);

  const isReady = Boolean(household && paycycle);

  return {
    config,
    cycleStart,
    currentBalance,
    startingBalance,
    targetDateFromRep,
    interestRate,
    suggestedAmount,
    targetDate,
    setTargetDate,
    amountStr,
    setAmountStr,
    amount,
    includeInterest,
    setIncludeInterest,
    locking,
    projection,
    cyclesToClear,
    payoffDate,
    progress,
    handleLockIn,
    handleUseSuggested,
    handleToggleInterest,
    isReady,
  };
}
