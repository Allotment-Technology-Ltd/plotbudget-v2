import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, BodyText, LabelText, Input, useTheme } from '@repo/native-ui';
import { DatePickerField } from './SeedFormModalComponents';
import { format } from 'date-fns';
import { currencySymbol, formatCurrency, type CurrencyCode } from '@repo/logic';
import {
  projectSavingsOverTime,
  suggestedSavingsAmount,
  endDateFromCycles,
  cyclesToGoalFromAmount,
} from '@/lib/forecast-projection';
import { lockInForecastApi } from '@/lib/forecast-api';
import type { Pot, Household, PayCycle, Seed } from '@repo/supabase';
import * as Haptics from 'expo-haptics';

interface PotForecastSectionProps {
  pot: Pot;
  household: Household | null;
  paycycle: PayCycle | null;
  linkedSeed: Seed | null;
  currency: CurrencyCode;
  onLockInSuccess?: () => void;
}

export function PotForecastSection({
  pot,
  household,
  paycycle,
  linkedSeed,
  currency,
  onLockInSuccess,
}: PotForecastSectionProps) {
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
      config.payCycleType
    );
  }, [currentAmount, targetAmount, cycleStart, targetDateFromPot, config.payCycleType]);

  const [targetDate, setTargetDate] = useState(targetDateFromPot ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amountStr, setAmountStr] = useState(
    linkedSeed
      ? String(linkedSeed.amount)
      : suggestedAmount != null
        ? String(suggestedAmount)
        : ''
  );
  const [locking, setLocking] = useState(false);

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

  const cyclesToGoal =
    amount > 0 ? cyclesToGoalFromAmount(currentAmount, targetAmount, amount) : 0;
  const goalDate =
    cyclesToGoal > 0 ? endDateFromCycles(cycleStart, cyclesToGoal - 1, config) : null;

  const handleLockIn = async () => {
    if (amount <= 0) return;
    hapticImpact('medium');
    setLocking(true);
    const result = await lockInForecastApi({
      potId: pot.id,
      repaymentId: null,
      amount,
      name: pot.name,
      type: 'savings',
    });
    setLocking(false);
    if ('success' in result && result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLockInSuccess?.();
    }
  };

  if (!household || !paycycle) return null;

  return (
    <Card variant="default" padding="lg" style={{ marginTop: spacing.lg }}>
      <LabelText style={{ marginBottom: spacing.sm }}>Forecast</LabelText>
      <BodyText color="secondary" style={{ marginBottom: spacing.md, fontSize: 13 }}>
        Set a target date to get a suggested amount, or enter an amount to see when you’ll reach your goal.
      </BodyText>

      <View style={{ marginBottom: spacing.md }}>
        <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>
          Target date
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
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
              }}>
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
            To reach goal by{' '}
            <Text variant="body-sm" style={{ fontWeight: '600' }}>
              {format(new Date(targetDate), 'MMM yyyy')}
            </Text>
            : save{' '}
            <Text variant="body-sm" style={{ fontWeight: '600', color: colors.savings }}>
              {formatCurrency(suggestedAmount, currency)}
            </Text>
            {' '}
            <Text variant="body-sm" color="secondary">per cycle</Text>
          </BodyText>
        )}
        {amount > 0 && remaining > 0 && goalDate && (
          <BodyText color="secondary">
            At{' '}
            <Text variant="body-sm" style={{ fontWeight: '600' }}>
              {formatCurrency(amount, currency)}
            </Text>
            {' '}per cycle: goal reached by{' '}
            <Text variant="body-sm" style={{ fontWeight: '600', color: colors.savings }}>
              {format(new Date(goalDate), 'MMM yyyy')}
            </Text>
          </BodyText>
        )}
        {!targetDate && (amount <= 0 || remaining <= 0) && (
          <BodyText color="secondary">Set a target date or amount to see the outcome.</BodyText>
        )}
      </View>

      {projection.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
            Projection
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.md }}>
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
                }}>
                <Text variant="label-sm" color="secondary">
                  Cycle {p.cycleIndex + 1}
                </Text>
                <BodyText>{format(new Date(p.date), 'MMM yyyy')}</BodyText>
                <BodyText style={{ color: colors.savings }}>
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
          }}>
          <Text
            variant="label-sm"
            style={{
              color: amount <= 0 || locking ? colors.textSecondary : '#fff',
            }}>
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
          }}>
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
