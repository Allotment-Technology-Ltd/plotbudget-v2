import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { hapticImpact } from '@/lib/haptics';
import {
  Card,
  Text,
  BodyText,
  LabelText,
  Input,
  useTheme,
} from '@repo/native-ui';
import { DatePickerField } from './SeedFormModalComponents';
import { format } from 'date-fns';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@repo/logic';
import {
  projectRepaymentOverTime,
  suggestedRepaymentAmount,
  endDateFromCycles,
  cyclesToClearFromAmount,
} from '@/lib/forecast-projection';
import { lockInForecastApi } from '@/lib/forecast-api';
import type { Repayment, Household, PayCycle, Seed } from '@repo/supabase';
import * as Haptics from 'expo-haptics';

interface RepaymentForecastSectionProps {
  repayment: Repayment;
  household: Household | null;
  paycycle: PayCycle | null;
  linkedSeed: Seed | null;
  currency: CurrencyCode;
  onLockInSuccess?: () => void;
}

export function RepaymentForecastSection({
  repayment,
  household,
  paycycle,
  linkedSeed,
  currency,
  onLockInSuccess,
}: RepaymentForecastSectionProps) {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const symbol = currencySymbol(currency);

  const config = useMemo(
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

  const suggestedAmount = useMemo(() => {
    if (!targetDateFromRep) return null;
    return suggestedRepaymentAmount(
      currentBalance,
      cycleStart,
      targetDateFromRep,
      config.payCycleType
    );
  }, [currentBalance, cycleStart, targetDateFromRep, config.payCycleType]);

  const [targetDate, setTargetDate] = useState(targetDateFromRep ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const handleLockIn = async () => {
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
  };

  if (!household || !paycycle) return null;

  const progress =
    startingBalance > 0
      ? Math.min(100, ((startingBalance - currentBalance) / startingBalance) * 100)
      : 0;

  return (
    <Card variant="default" padding="lg" style={{ marginTop: spacing.lg }}>
      <LabelText style={{ marginBottom: spacing.md }}>Forecast</LabelText>

      <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
        {symbol}
        {currentBalance.toFixed(2)} / {symbol}
        {startingBalance.toFixed(2)} remaining
      </Text>
      <View
        style={{
          height: 8,
          backgroundColor: colors.borderSubtle,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.warning,
            borderRadius: borderRadius.full,
          }}
        />
      </View>

      <BodyText color="secondary" style={{ marginBottom: spacing.md, fontSize: 13 }}>
        Set a target payoff date to get a suggested amount, or enter an amount to see when you’ll clear the debt.
      </BodyText>

      <View style={{ marginBottom: spacing.md }}>
        <Text
          variant="label-sm"
          color="secondary"
          style={{ marginBottom: spacing.xs }}
        >
          Target payoff date
        </Text>
        <DatePickerField
          value={targetDate}
          onChange={setTargetDate}
          showPicker={showDatePicker}
          onShowPicker={() => setShowDatePicker(true)}
          onHidePicker={() => setShowDatePicker(false)}
          minDate={new Date()}
        />
      </View>

      <View style={{ marginBottom: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <Text variant="label-sm" color="secondary">
            Amount per cycle ({symbol})
          </Text>
          {suggestedAmount != null && targetDate && (
            <Pressable
              onPress={() => {
                hapticImpact('light');
                setAmountStr(suggestedAmount.toFixed(2));
              }}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: borderRadius.sm,
                borderWidth: 1,
                borderColor: colors.accentPrimary,
              }}
            >
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                Use suggested
              </Text>
            </Pressable>
          )}
        </View>
        <Input
          value={amountStr}
          onChangeText={(t) => setAmountStr(t.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>

      <View
        style={{
          marginBottom: spacing.md,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.bgElevated,
        }}
        accessible
        accessibilityRole="summary"
        accessibilityLabel="Forecast outcome"
      >
        {targetDate && suggestedAmount != null && (
          <BodyText color="secondary" style={{ marginBottom: 4 }}>
            To clear by{' '}
            <Text variant="body-sm" style={{ fontWeight: '600' }}>
              {format(new Date(targetDate), 'MMM yyyy')}
            </Text>
            : pay{' '}
            <Text variant="body-sm" style={{ fontWeight: '600', color: colors.warning }}>
              {formatCurrency(suggestedAmount, currency)}
            </Text>
            {' '}
            <Text variant="body-sm" color="secondary">per cycle</Text>
          </BodyText>
        )}
        {amount > 0 && currentBalance > 0 && payoffDate && (
          <BodyText color="secondary">
            At{' '}
            <Text variant="body-sm" style={{ fontWeight: '600' }}>
              {formatCurrency(amount, currency)}
            </Text>
            {' '}per cycle: cleared by{' '}
            <Text variant="body-sm" style={{ fontWeight: '600', color: colors.warning }}>
              {format(new Date(payoffDate), 'MMM yyyy')}
            </Text>
          </BodyText>
        )}
        {!targetDate && (amount <= 0 || currentBalance <= 0) && (
          <BodyText color="secondary">Set a target date or amount to see the outcome.</BodyText>
        )}
      </View>

      {interestRate != null && interestRate > 0 && (
        <Pressable
          onPress={() => {
            hapticImpact('light');
            setIncludeInterest((prev) => !prev);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: borderRadius.sm,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: includeInterest ? colors.accentPrimary : 'transparent',
            }}
          >
            {includeInterest && (
              <Text variant="label-sm" style={{ color: '#fff' }}>
                ✓
              </Text>
            )}
          </View>
          <BodyText color="secondary">
            Include interest ({interestRate}% p.a.) in projection
          </BodyText>
        </Pressable>
      )}

      {projection.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text
            variant="label-sm"
            color="secondary"
            style={{ marginBottom: spacing.sm }}
          >
            Projection
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.md }}
          >
            {projection.slice(0, 12).map((p) => (
              <View
                key={p.cycleIndex}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  marginRight: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: colors.bgElevated,
                  minWidth: 80,
                }}
              >
                <Text variant="label-sm" color="secondary">
                  Cycle {p.cycleIndex + 1}
                </Text>
                <BodyText>{format(new Date(p.date), 'MMM yyyy')}</BodyText>
                <BodyText style={{ color: colors.warning }}>
                  {formatCurrency(p.balance, currency)}
                </BodyText>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Pressable
          onPress={handleLockIn}
          disabled={amount <= 0 || locking}
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            backgroundColor:
              amount <= 0 || locking ? colors.borderSubtle : colors.accentPrimary,
          }}
        >
          <Text
            variant="label-sm"
            style={{
              color: amount <= 0 || locking ? colors.textSecondary : '#fff',
            }}
          >
            {locking
              ? 'Locking in…'
              : `Lock in ${formatCurrency(amount || 0, currency)} per cycle`}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticImpact('light');
            router.push('/(tabs)/two' as import('expo-router').Href);
          }}
          style={{
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.accentPrimary,
          }}
        >
          <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
            Edit in Blueprint
          </Text>
        </Pressable>
      </View>

      <BodyText
        color="secondary"
        style={{ marginTop: spacing.md, fontSize: 12 }}
      >
        Projections are for planning only. PLOT does not provide financial advice.
      </BodyText>
    </Card>
  );
}
