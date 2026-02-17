/**
 * Form section components for SeedFormModal.
 * Extracted to reduce SeedFormModal size and separate concerns.
 */

import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { parseIncome } from '@repo/logic';
import { Card, BodyText, LabelText, Input, Text, useTheme } from '@repo/native-ui';
import { PillButton, DatePickerField, StatusPicker } from './SeedFormModalComponents';
import type { Pot, Repayment } from '@repo/supabase';

const POT_STATUS_OPTIONS: { value: 'active' | 'complete' | 'paused'; label: string }[] = [
  { value: 'active', label: 'Saving' },
  { value: 'complete', label: 'Accomplished' },
  { value: 'paused', label: 'Paused' },
];

const REPAYMENT_STATUS_OPTIONS: { value: 'active' | 'paid' | 'paused'; label: string }[] = [
  { value: 'active', label: 'Clearing' },
  { value: 'paused', label: 'Paused' },
  { value: 'paid', label: 'Cleared' },
];

export function SeedFormDueDateField({
  value,
  onChange,
  showPicker,
  onShowPicker,
  onHidePicker,
  cycleStartDate,
  cycleEndDate,
}: {
  value: string;
  onChange: (v: string) => void;
  showPicker: boolean;
  onShowPicker: () => void;
  onHidePicker: () => void;
  cycleStartDate: string;
  cycleEndDate: string;
}) {
  const { spacing } = useTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Due date (optional)</LabelText>
      <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
        When the due date has passed, this item is automatically marked as paid.
      </Text>
      <DatePickerField
        value={value}
        onChange={onChange}
        showPicker={showPicker}
        onShowPicker={onShowPicker}
        onHidePicker={onHidePicker}
        minDate={new Date(cycleStartDate + 'T00:00:00')}
        maxDate={new Date(cycleEndDate + 'T23:59:59')}
      />
    </View>
  );
}

export function SeedFormSavingsSection({
  pots,
  linkPotId,
  setLinkPotId,
  potCurrentStr,
  setPotCurrentStr,
  potTargetStr,
  setPotTargetStr,
  potTargetDate,
  setPotTargetDate,
  showPotDatePicker,
  setShowPotDatePicker,
  potStatus,
  setPotStatus,
  symbol,
  showNewPotFields,
}: {
  pots: Pot[];
  linkPotId: string | null;
  setLinkPotId: (id: string | null) => void;
  potCurrentStr: string;
  setPotCurrentStr: (v: string) => void;
  potTargetStr: string;
  setPotTargetStr: (v: string) => void;
  potTargetDate: string;
  setPotTargetDate: (v: string) => void;
  showPotDatePicker: boolean;
  setShowPotDatePicker: (v: boolean) => void;
  potStatus: 'active' | 'complete' | 'paused';
  setPotStatus: (v: 'active' | 'complete' | 'paused') => void;
  symbol: string;
  showNewPotFields: boolean;
}) {
  const { spacing } = useTheme();

  return (
    <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
      <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Savings goal (optional)</LabelText>

      {pots.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Link to existing pot</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <PillButton label="None – create new" selected={!linkPotId} onPress={() => setLinkPotId(null)} />
            {pots.map((p) => (
              <PillButton key={p.id} label={p.name} selected={linkPotId === p.id} onPress={() => setLinkPotId(p.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      {showNewPotFields && (
        <>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Current ({symbol})</Text>
              <Input value={potCurrentStr} onChangeText={(v) => setPotCurrentStr(v.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Target ({symbol})</Text>
              <Input value={potTargetStr} onChangeText={(v) => setPotTargetStr(v.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="decimal-pad" />
            </View>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Target date</Text>
            <DatePickerField
              value={potTargetDate}
              onChange={setPotTargetDate}
              showPicker={showPotDatePicker}
              onShowPicker={() => setShowPotDatePicker(true)}
              onHidePicker={() => setShowPotDatePicker(false)}
            />
          </View>

          <View>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Status</Text>
            <StatusPicker
              options={POT_STATUS_OPTIONS}
              value={potStatus}
              onChange={(v) => setPotStatus(v as 'active' | 'complete' | 'paused')}
            />
          </View>
        </>
      )}
    </Card>
  );
}

export function SeedFormRepaymentSection({
  repayments,
  linkRepaymentId,
  setLinkRepaymentId,
  repaymentCurrentStr,
  setRepaymentCurrentStr,
  repaymentTargetDate,
  setRepaymentTargetDate,
  repaymentInterestRateStr,
  setRepaymentInterestRateStr,
  showRepayDatePicker,
  setShowRepayDatePicker,
  repaymentStatus,
  setRepaymentStatus,
  symbol,
  showNewRepayFields,
}: {
  repayments: Repayment[];
  linkRepaymentId: string | null;
  setLinkRepaymentId: (id: string | null) => void;
  repaymentCurrentStr: string;
  setRepaymentCurrentStr: (v: string) => void;
  repaymentTargetDate: string;
  setRepaymentTargetDate: (v: string) => void;
  repaymentInterestRateStr: string;
  setRepaymentInterestRateStr: (v: string) => void;
  showRepayDatePicker: boolean;
  setShowRepayDatePicker: (v: boolean) => void;
  repaymentStatus: 'active' | 'paid' | 'paused';
  setRepaymentStatus: (v: 'active' | 'paid' | 'paused') => void;
  symbol: string;
  showNewRepayFields: boolean;
}) {
  const { spacing } = useTheme();

  return (
    <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
      <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Debt / Repayment (optional)</LabelText>

      {repayments.length > 0 && (
        <View style={{ marginBottom: spacing.md }}>
          <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Link to existing repayment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <PillButton label="None – create new" selected={!linkRepaymentId} onPress={() => setLinkRepaymentId(null)} />
            {repayments.map((r) => (
              <PillButton key={r.id} label={r.name} selected={linkRepaymentId === r.id} onPress={() => setLinkRepaymentId(r.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      {showNewRepayFields && (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Current balance ({symbol})</Text>
            <Input value={repaymentCurrentStr} onChangeText={(v) => setRepaymentCurrentStr(v.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="decimal-pad" />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Target payoff date</Text>
            <DatePickerField
              value={repaymentTargetDate}
              onChange={setRepaymentTargetDate}
              showPicker={showRepayDatePicker}
              onShowPicker={() => setShowRepayDatePicker(true)}
              onHidePicker={() => setShowRepayDatePicker(false)}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>
              Interest rate (APR %) — optional
            </Text>
            <Input
              value={repaymentInterestRateStr}
              onChangeText={(v) => setRepaymentInterestRateStr(v.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 18.9"
              keyboardType="decimal-pad"
            />
          </View>

          <View>
            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Status</Text>
            <StatusPicker
              options={REPAYMENT_STATUS_OPTIONS}
              value={repaymentStatus}
              onChange={(v) => setRepaymentStatus(v as 'active' | 'paid' | 'paused')}
            />
          </View>
        </>
      )}
    </Card>
  );
}

type PaymentSource = 'me' | 'partner' | 'joint';

export function SeedFormPaymentSourceSection({
  paymentSource,
  setPaymentSource,
  ownerLabel,
  partnerLabel,
  splitRatio,
  setSplitRatio,
  usesJointAccount,
  setUsesJointAccount,
  amountStr,
  symbol,
}: {
  paymentSource: PaymentSource;
  setPaymentSource: (v: PaymentSource) => void;
  ownerLabel: string;
  partnerLabel: string;
  splitRatio: number;
  setSplitRatio: (v: number) => void;
  usesJointAccount: boolean;
  setUsesJointAccount: (v: boolean) => void;
  amountStr: string;
  symbol: string;
}) {
  const { colors, spacing } = useTheme();

  return (
    <>
      <View style={{ marginBottom: spacing.md }}>
        <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Payment source</LabelText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {([
            { value: 'me' as const, label: ownerLabel },
            { value: 'partner' as const, label: partnerLabel },
            { value: 'joint' as const, label: 'JOINT' },
          ] as const).map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => { hapticSelection(); setPaymentSource(opt.value); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.sm,
              }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: paymentSource === opt.value ? colors.accentPrimary : colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {paymentSource === opt.value && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentPrimary }} />
                )}
              </View>
              <Text variant="body-sm">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {paymentSource === 'joint' && (
        <>
          <View style={{ marginBottom: spacing.md }}>
            <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Split ratio</LabelText>
            <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
              {ownerLabel}: {splitRatio}% / {partnerLabel}: {100 - splitRatio}%
            </Text>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              value={splitRatio}
              onValueChange={(v) => setSplitRatio(Math.round(v))}
              minimumTrackTintColor={colors.accentPrimary}
              maximumTrackTintColor={colors.borderSubtle}
              thumbTintColor={colors.accentPrimary}
              style={{ height: 40 }}
            />
            {parseIncome(amountStr) > 0 && (
              <Text variant="body-sm" color="secondary" style={{ marginTop: spacing.xs }}>
                {ownerLabel}: {symbol}{(parseIncome(amountStr) * splitRatio / 100).toFixed(2)} • {partnerLabel}: {symbol}{(parseIncome(amountStr) * (100 - splitRatio) / 100).toFixed(2)}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => { hapticImpact('light'); setUsesJointAccount(!usesJointAccount); }}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: usesJointAccount ? colors.accentPrimary : colors.borderSubtle,
                backgroundColor: usesJointAccount ? colors.accentPrimary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}>
              {usesJointAccount && <BodyText style={{ color: '#fff', fontSize: 14, lineHeight: 18 }}>✓</BodyText>}
            </View>
            <View style={{ flex: 1 }}>
              <BodyText style={{ fontWeight: '600' }}>Paid from joint account</BodyText>
              <Text variant="label-sm" color="secondary" style={{ marginTop: 2 }}>
                Include in joint transfer calculation. Uncheck if you each pay your share from your own accounts.
              </Text>
            </View>
          </Pressable>
        </>
      )}
    </>
  );
}

export function SeedFormRecurringCheckbox({
  isRecurring,
  setIsRecurring,
}: {
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={() => { hapticImpact('light'); setIsRecurring(!isRecurring); }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: isRecurring ? colors.accentPrimary : colors.borderSubtle,
          backgroundColor: isRecurring ? colors.accentPrimary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        {isRecurring && <BodyText style={{ color: '#fff', fontSize: 14, lineHeight: 18 }}>✓</BodyText>}
      </View>
      <View style={{ flex: 1 }}>
        <BodyText style={{ fontWeight: '600' }}>Recurring</BodyText>
        <Text variant="label-sm" color="secondary" style={{ marginTop: 2 }}>Include in next pay cycle</Text>
      </View>
    </Pressable>
  );
}
