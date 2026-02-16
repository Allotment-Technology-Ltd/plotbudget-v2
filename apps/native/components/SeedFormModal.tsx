import React, { useState, useEffect } from 'react';
import { View, Pressable, Platform, ScrollView } from 'react-native';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { PillButton, DatePickerField, StatusPicker } from './SeedFormModalComponents';
import {
  Container,
  Section,
  Card,
  Text,
  BodyText,
  LabelText,
  Input,
  Button,
  useTheme,
} from '@repo/native-ui';
import { parseIncome } from '@repo/logic';
import type { Seed, Pot, Repayment, PayCycle, Household } from '@repo/supabase';
import { createSeedApi, updateSeedApi } from '@/lib/seed-api';
import { AppBottomSheet } from './AppBottomSheet';

type SeedType = 'need' | 'want' | 'savings' | 'repay';
type PaymentSource = 'me' | 'partner' | 'joint';

const CATEGORY_LABELS: Record<SeedType, string> = {
  need: 'Need',
  want: 'Want',
  savings: 'Saving',
  repay: 'Repayment',
};

const NAME_PLACEHOLDERS: Record<SeedType, string> = {
  need: 'e.g. Rent, Electric bill',
  want: 'e.g. Netflix, Gym',
  savings: 'e.g. Holiday fund',
  repay: 'e.g. Credit card, Loan repayment',
};

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

interface SeedFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: SeedType;
  seed: Seed | null;
  household: Household;
  paycycle: PayCycle;
  pots: Pot[];
  repayments: Repayment[];
}

export function SeedFormModal({
  visible,
  onClose,
  onSuccess,
  category,
  seed,
  household,
  paycycle,
  pots,
  repayments,
}: SeedFormModalProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const isCouple = !!(household as { is_couple?: boolean }).is_couple;
  const ownerLabel = (household as { owner_name?: string }).owner_name?.toUpperCase() || 'ME';
  const partnerLabel = (household as { partner_name?: string }).partner_name?.toUpperCase() || 'PARTNER';

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('me');
  const [dueDate, setDueDate] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // Savings fields
  const [linkPotId, setLinkPotId] = useState<string | null>(null);
  const [potCurrentStr, setPotCurrentStr] = useState('');
  const [potTargetStr, setPotTargetStr] = useState('');
  const [potTargetDate, setPotTargetDate] = useState('');
  const [showPotDatePicker, setShowPotDatePicker] = useState(false);
  const [potStatus, setPotStatus] = useState<'active' | 'complete' | 'paused'>('active');

  // Repayment fields
  const [linkRepaymentId, setLinkRepaymentId] = useState<string | null>(null);
  const [repaymentCurrentStr, setRepaymentCurrentStr] = useState('');
  const [repaymentTargetDate, setRepaymentTargetDate] = useState('');
  const [showRepayDatePicker, setShowRepayDatePicker] = useState(false);
  const [repaymentStatus, setRepaymentStatus] = useState<'active' | 'paid' | 'paused'>('active');

  // Joint fields
  const [splitRatio, setSplitRatio] = useState(50);
  const [usesJointAccount, setUsesJointAccount] = useState(true);
  const [isRecurring, setIsRecurring] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editMode = !!seed;
  const currency = household?.currency ?? 'GBP';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

  const cycleStartDate =
    paycycle.start_date <= paycycle.end_date ? paycycle.start_date : paycycle.end_date;
  const cycleEndDate =
    paycycle.start_date <= paycycle.end_date ? paycycle.end_date : paycycle.start_date;

  useEffect(() => {
    if (visible) {
      setError(null);
      const defaultJointRatio = Math.round(((household as { joint_ratio?: number }).joint_ratio ?? 0.5) * 100);
      if (seed) {
        setName(seed.name ?? '');
        setAmountStr(seed.amount ? String(seed.amount) : '');
        setPaymentSource((seed.payment_source as PaymentSource) ?? 'me');
        setDueDate((seed as { due_date?: string }).due_date ?? '');
        setSplitRatio(
          (seed as { split_ratio?: number | null }).split_ratio != null
            ? Math.round(((seed as { split_ratio?: number }).split_ratio ?? 0.5) * 100)
            : defaultJointRatio
        );
        setUsesJointAccount((seed as { uses_joint_account?: boolean }).uses_joint_account ?? true);
        setIsRecurring(seed.is_recurring ?? true);

        const linkedPot = seed.linked_pot_id ? pots.find((p) => p.id === seed.linked_pot_id) : null;
        const linkedRep = seed.linked_repayment_id
          ? repayments.find((r) => r.id === seed.linked_repayment_id)
          : null;

        setLinkPotId(seed.linked_pot_id ?? null);
        setPotCurrentStr(linkedPot ? String(linkedPot.current_amount) : '');
        setPotTargetStr(linkedPot ? String(linkedPot.target_amount) : '');
        setPotTargetDate(linkedPot?.target_date ?? '');
        setPotStatus((linkedPot?.status as 'active' | 'complete' | 'paused') ?? 'active');

        setLinkRepaymentId(seed.linked_repayment_id ?? null);
        setRepaymentCurrentStr(linkedRep ? String(linkedRep.current_balance) : '');
        setRepaymentTargetDate(linkedRep?.target_date ?? '');
        setRepaymentStatus((linkedRep?.status as 'active' | 'paid' | 'paused') ?? 'active');
      } else {
        setName('');
        setAmountStr('');
        setPaymentSource('me');
        setDueDate('');
        setSplitRatio(defaultJointRatio);
        setUsesJointAccount(true);
        setIsRecurring(true);
        setLinkPotId(null);
        setPotCurrentStr('');
        setPotTargetStr('');
        setPotTargetDate('');
        setPotStatus('active');
        setLinkRepaymentId(null);
        setRepaymentCurrentStr('');
        setRepaymentTargetDate('');
        setRepaymentStatus('active');
      }
    }
  }, [visible, seed, pots, repayments, household]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Name is required'); return; }
    const amount = parseIncome(amountStr);
    if (!Number.isFinite(amount) || amount < 0.01) { setError('Amount must be greater than 0'); return; }
    if (dueDate && (dueDate < cycleStartDate || dueDate > cycleEndDate)) {
      setError(`Due date must be within ${cycleStartDate} – ${cycleEndDate}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editMode && seed) {
        const payload: Record<string, unknown> = {
          name: trimmedName,
          amount,
          due_date: dueDate.trim() || null,
          payment_source: isCouple ? paymentSource : 'me',
          split_ratio: isCouple && paymentSource === 'joint' ? splitRatio / 100 : undefined,
          uses_joint_account: isCouple && paymentSource === 'joint' ? usesJointAccount : false,
          is_recurring: category === 'savings' || category === 'repay' ? true : isRecurring,
        };

        if (category === 'savings') {
          if (seed.linked_pot_id) {
            payload.pot = {
              current_amount: parseIncome(potCurrentStr) || 0,
              target_amount: parseIncome(potTargetStr) || 0,
              target_date: potTargetDate || null,
              status: potStatus,
            };
          } else if (linkPotId || parseIncome(potTargetStr) > 0) {
            payload.linked_pot_id = linkPotId;
            if (!linkPotId) {
              payload.pot = {
                current_amount: parseIncome(potCurrentStr) || 0,
                target_amount: parseIncome(potTargetStr) || 0,
                target_date: potTargetDate || null,
                status: potStatus,
              };
            }
          }
        }
        if (category === 'repay') {
          if (seed.linked_repayment_id) {
            payload.repayment = {
              current_balance: parseIncome(repaymentCurrentStr) || 0,
              target_date: repaymentTargetDate || null,
              status: repaymentStatus,
            };
          } else if (linkRepaymentId || parseIncome(repaymentCurrentStr) > 0) {
            payload.linked_repayment_id = linkRepaymentId;
            if (!linkRepaymentId) {
              payload.repayment = {
                starting_balance: parseIncome(repaymentCurrentStr) || 0,
                current_balance: parseIncome(repaymentCurrentStr) || 0,
                target_date: repaymentTargetDate || null,
                status: repaymentStatus,
              };
            }
          }
        }

        const result = await updateSeedApi(seed.id, payload as Parameters<typeof updateSeedApi>[1]);
        if ('error' in result) { setError(result.error); return; }
      } else {
        const payload: Record<string, unknown> = {
          name: trimmedName,
          amount,
          type: category,
          payment_source: isCouple ? paymentSource : ('me' as const),
          split_ratio: isCouple && paymentSource === 'joint' ? splitRatio / 100 : undefined,
          uses_joint_account: isCouple && paymentSource === 'joint' ? usesJointAccount : false,
          paycycle_id: paycycle.id,
          household_id: household.id,
          is_recurring: category === 'savings' || category === 'repay' ? true : isRecurring,
          due_date: dueDate.trim() || null,
        };

        if (category === 'savings') {
          if (linkPotId) {
            payload.linked_pot_id = linkPotId;
          } else if (parseIncome(potTargetStr) > 0) {
            payload.pot = {
              current_amount: parseIncome(potCurrentStr) || 0,
              target_amount: parseIncome(potTargetStr) || 0,
              target_date: potTargetDate || null,
              status: potStatus,
            };
          }
        }
        if (category === 'repay') {
          if (linkRepaymentId) {
            payload.linked_repayment_id = linkRepaymentId;
          } else if (parseIncome(repaymentCurrentStr) > 0) {
            const bal = parseIncome(repaymentCurrentStr) || 0;
            payload.repayment = {
              starting_balance: bal,
              current_balance: bal,
              target_date: repaymentTargetDate || null,
              status: repaymentStatus,
            };
          }
        }

        const result = await createSeedApi(payload as unknown as Parameters<typeof createSeedApi>[0]);
        if ('error' in result) { setError(result.error); return; }
      }
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const showNewPotFields = !linkPotId || (editMode && !!seed?.linked_pot_id);
  const showNewRepayFields = !linkRepaymentId || (editMode && !!seed?.linked_repayment_id);

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['60%', '95%']}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 48 }}>
        <Container paddingX="md">
            <Section spacing="lg">
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text variant="headline-sm">
                  {editMode ? `Edit ${CATEGORY_LABELS[category]}` : `Add ${CATEGORY_LABELS[category]}`}
                </Text>
                <Pressable onPress={() => { hapticImpact('light'); onClose(); }} hitSlop={12}>
                  <BodyText color="secondary" style={{ fontSize: 18 }}>✕</BodyText>
                </Pressable>
              </View>

              {error && (
                <Card variant="default" padding="sm" style={{ marginBottom: spacing.md, borderColor: colors.error }}>
                  <BodyText color="error">{error}</BodyText>
                </Card>
              )}

              {/* Name */}
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Name</LabelText>
                <Input
                  value={name}
                  onChangeText={(t) => setName(t.toUpperCase())}
                  placeholder={NAME_PLACEHOLDERS[category]}
                  autoCapitalize="none"
                  inputStyle={{ textTransform: 'uppercase' }}
                />
              </View>

              {/* Due date */}
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Due date (optional)</LabelText>
                <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
                  When the due date has passed, this item is automatically marked as paid.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Pressable
                    onPress={() => { hapticImpact('light'); setShowDueDatePicker(true); }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      backgroundColor: colors.bgSecondary,
                    }}>
                    <BodyText style={{ color: dueDate ? colors.textPrimary : colors.textSecondary }}>
                      {dueDate
                        ? new Date(dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Pick date'}
                    </BodyText>
                  </Pressable>
                  {dueDate ? (
                    <Pressable onPress={() => { hapticImpact('light'); setDueDate(''); }} style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.sm }}>
                      <Text variant="body-sm" style={{ color: colors.error }}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
                {showDueDatePicker && (
                  <>
                    <DateTimePicker
                      value={dueDate ? new Date(dueDate + 'T12:00:00') : new Date(cycleStartDate + 'T12:00:00')}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={new Date(cycleStartDate + 'T00:00:00')}
                      maximumDate={new Date(cycleEndDate + 'T23:59:59')}
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowDueDatePicker(false);
                        if (date) setDueDate(date.toISOString().slice(0, 10));
                      }}
                    />
                    {Platform.OS === 'ios' && (
                      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs }}>
                        <Pressable onPress={() => { hapticImpact('light'); setShowDueDatePicker(false); }} style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                          <BodyText style={{ color: colors.accentPrimary }}>Done</BodyText>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Savings section */}
              {category === 'savings' && (
                <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Savings goal (optional)</LabelText>

                  {/* Link selector */}
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

                      {/* Target date */}
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

                      {/* Status */}
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
              )}

              {/* Repayment section */}
              {category === 'repay' && (
                <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Debt / Repayment (optional)</LabelText>

                  {/* Link selector */}
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
                      {/* Current balance */}
                      <View style={{ marginBottom: spacing.md }}>
                        <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>Current balance ({symbol})</Text>
                        <Input value={repaymentCurrentStr} onChangeText={(v) => setRepaymentCurrentStr(v.replace(/[^0-9.]/g, ''))} placeholder="0" keyboardType="decimal-pad" />
                      </View>

                      {/* Target payoff date */}
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

                      {/* Status */}
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
              )}

              {/* Amount */}
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Amount ({symbol})</LabelText>
                <Input
                  value={amountStr}
                  onChangeText={(v) => setAmountStr(v.replace(/[^0-9.]/g, ''))}
                  placeholder={`${symbol} 0.00`}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Payment source (couple only) */}
              {isCouple && (
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
              )}

              {/* Joint: split ratio + joint account checkbox */}
              {isCouple && paymentSource === 'joint' && (
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

              {/* Recurring checkbox (needs/wants only) */}
              {(category === 'need' || category === 'want') && (
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
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md }}>
                <Button variant="outline" onPress={() => { hapticImpact('light'); onClose(); }}>Cancel</Button>
                <Button onPress={() => { hapticImpact('light'); void handleSubmit(); }} isLoading={submitting} disabled={submitting}>
                  {editMode ? 'Save Changes' : 'Add'}
                </Button>
              </View>
            </Section>
          </Container>
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}
