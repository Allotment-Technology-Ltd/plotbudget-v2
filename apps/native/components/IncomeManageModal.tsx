import React, { useState, useEffect } from 'react';
import { View, Pressable, Switch, Alert } from 'react-native';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  Card,
  HeadlineText,
  BodyText,
  LabelText,
  Input,
  Button,
  useTheme,
} from '@repo/native-ui';
import { parseIncome } from '@repo/logic';
import { currencySymbol } from '@repo/logic';
import type { CurrencyCode } from '@repo/logic';
import {
  createIncomeSourceApi,
  updateIncomeSourceApi,
  deleteIncomeSourceApi,
  type IncomeSource as ApiIncomeSource,
  type FrequencyRule,
  type PaymentSource,
} from '@/lib/income-source-api';
import type { IncomeSource as BlueprintIncomeSource } from '@/lib/blueprint-data';
import { AppBottomSheet } from './AppBottomSheet';

const FREQUENCY_OPTIONS: { value: FrequencyRule; label: string }[] = [
  { value: 'specific_date', label: 'Specific date (e.g. 25th)' },
  { value: 'last_working_day', label: 'Last working day of month' },
  { value: 'every_4_weeks', label: 'Every 4 weeks' },
];

const PAYMENT_SOURCE_OPTIONS: { value: PaymentSource; label: string }[] = [
  { value: 'me', label: 'Me' },
  { value: 'partner', label: 'Partner' },
  { value: 'joint', label: 'Joint' },
];

function frequencySubline(s: BlueprintIncomeSource | ApiIncomeSource): string {
  if (s.frequency_rule === 'specific_date' && s.day_of_month != null) {
    return `Day ${s.day_of_month} of month`;
  }
  if (s.frequency_rule === 'last_working_day') return 'Last working day';
  if (s.frequency_rule === 'every_4_weeks' && s.anchor_date) {
    return `Every 4 weeks from ${s.anchor_date}`;
  }
  return s.frequency_rule.replace('_', ' ');
}

interface IncomeManageModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  householdId: string;
  incomeSources: BlueprintIncomeSource[];
  currency: CurrencyCode;
  isPartner?: boolean;
}

export function IncomeManageModal({
  visible,
  onClose,
  onSuccess,
  householdId,
  incomeSources,
  currency,
  isPartner = false,
}: IncomeManageModalProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [frequencyRule, setFrequencyRule] = useState<FrequencyRule>('specific_date');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [anchorDate, setAnchorDate] = useState('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('me');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

  useEffect(() => {
    if (visible && !showForm) {
      setError(null);
      setEditingId(null);
      setName('');
      setAmountStr('');
      setFrequencyRule('specific_date');
      setDayOfMonth('1');
      setAnchorDate('');
      setPaymentSource(isPartner ? 'partner' : 'me');
    }
  }, [visible, showForm, isPartner]);

  useEffect(() => {
    if (editingId && visible) {
      const s = incomeSources.find((x) => x.id === editingId);
      if (s) {
        setName(s.name);
        setAmountStr(String(s.amount));
        setFrequencyRule(s.frequency_rule);
        setDayOfMonth(s.day_of_month != null ? String(s.day_of_month) : '1');
        setAnchorDate(s.anchor_date ?? '');
        setPaymentSource(s.payment_source);
      }
    }
  }, [editingId, incomeSources, visible]);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setAmountStr('');
    setFrequencyRule('specific_date');
    setDayOfMonth('1');
    setAnchorDate('');
    setPaymentSource(isPartner ? 'partner' : 'me');
    setError(null);
    setShowForm(true);
  };

  const openEdit = (source: BlueprintIncomeSource) => {
    setEditingId(source.id);
    setName(source.name);
    setAmountStr(String(source.amount));
    setFrequencyRule(source.frequency_rule);
    setDayOfMonth(source.day_of_month != null ? String(source.day_of_month) : '1');
    setAnchorDate(source.anchor_date ?? '');
    setPaymentSource(source.payment_source);
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    const amount = parseIncome(amountStr);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid amount');
      return;
    }
    if (frequencyRule === 'specific_date') {
      const day = parseInt(dayOfMonth, 10);
      if (day < 1 || day > 31) {
        setError('Day of month must be 1–31');
        return;
      }
    }
    if (frequencyRule === 'every_4_weeks' && !anchorDate.trim()) {
      setError('First pay date is required for every 4 weeks');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const res = await updateIncomeSourceApi(editingId, {
          name: trimmedName,
          amount,
          frequency_rule: frequencyRule,
          day_of_month: frequencyRule === 'specific_date' ? parseInt(dayOfMonth, 10) : null,
          anchor_date: frequencyRule === 'every_4_weeks' ? anchorDate.trim() || null : null,
          payment_source: paymentSource,
        });
        if ('error' in res) {
          setError(res.error);
          return;
        }
        onSuccess();
        setShowForm(false);
      } else {
        const res = await createIncomeSourceApi({
          household_id: householdId,
          name: trimmedName,
          amount,
          frequency_rule: frequencyRule,
          day_of_month: frequencyRule === 'specific_date' ? parseInt(dayOfMonth, 10) : null,
          anchor_date: frequencyRule === 'every_4_weeks' ? anchorDate.trim() || null : null,
          payment_source: paymentSource,
        });
        if ('error' in res) {
          setError(res.error);
          return;
        }
        onSuccess();
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (source: BlueprintIncomeSource) => {
    const res = await updateIncomeSourceApi(source.id, { is_active: !source.is_active });
    if (!('error' in res)) onSuccess();
  };

  const handleDeleteConfirm = (id: string) => {
    setDeletingId(id);
    deleteIncomeSourceApi(id).then((res) => {
      setDeletingId(null);
      if (!('error' in res)) onSuccess();
    });
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['60%', '95%']}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize"
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
        <HeadlineText style={{ fontSize: 18 }}>Income sources</HeadlineText>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {showForm ? (
            <Pressable onPress={() => { hapticImpact('light'); setShowForm(false); }}>
              <BodyText style={{ color: colors.accentPrimary }}>Cancel</BodyText>
            </Pressable>
          ) : (
            <Pressable onPress={() => { hapticImpact('light'); openAdd(); }}>
              <BodyText style={{ color: colors.accentPrimary, fontWeight: '600' }}>Add</BodyText>
            </Pressable>
          )}
          <Pressable onPress={() => { hapticImpact('light'); onClose(); }}>
            <BodyText style={{ color: colors.textSecondary }}>Done</BodyText>
          </Pressable>
        </View>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing['2xl'] }} keyboardShouldPersistTaps="handled">
          {error ? (
            <View style={{ marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.error + '20', borderRadius: borderRadius.md }}>
              <BodyText style={{ color: colors.error }}>{error}</BodyText>
            </View>
          ) : null}

          {showForm ? (
            <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
              <HeadlineText style={{ marginBottom: spacing.md, fontSize: 16 }}>
                {editingId ? 'Edit income source' : 'Add income source'}
              </HeadlineText>
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Name</LabelText>
                <Input value={name} onChangeText={setName} placeholder="e.g. My salary" />
              </View>
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Amount ({symbol})</LabelText>
                <Input
                  value={amountStr}
                  onChangeText={(v) => setAmountStr(v.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Frequency</LabelText>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => { hapticSelection(); setFrequencyRule(opt.value); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      marginBottom: spacing.xs,
                      borderRadius: borderRadius.md,
                      backgroundColor: frequencyRule === opt.value ? colors.accentPrimary + '20' : colors.bgElevated,
                      borderWidth: 1,
                      borderColor: frequencyRule === opt.value ? colors.accentPrimary : colors.borderSubtle,
                    }}>
                    <BodyText style={{ color: frequencyRule === opt.value ? colors.accentPrimary : colors.textPrimary }}>{opt.label}</BodyText>
                  </Pressable>
                ))}
              </View>
              {frequencyRule === 'specific_date' && (
                <View style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Day of month (1–31)</LabelText>
                  <Input
                    value={dayOfMonth}
                    onChangeText={(v) => setDayOfMonth(v.replace(/\D/g, '').slice(0, 2))}
                    placeholder="1"
                    keyboardType="number-pad"
                  />
                </View>
              )}
              {frequencyRule === 'every_4_weeks' && (
                <View style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>First pay date</LabelText>
                  <Input
                    value={anchorDate}
                    onChangeText={setAnchorDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              )}
              {!isPartner && (
                <View style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Who gets this income</LabelText>
                  {PAYMENT_SOURCE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => { hapticSelection(); setPaymentSource(opt.value); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        marginBottom: spacing.xs,
                        borderRadius: borderRadius.md,
                        backgroundColor: paymentSource === opt.value ? colors.accentPrimary + '20' : colors.bgElevated,
                        borderWidth: 1,
                        borderColor: paymentSource === opt.value ? colors.accentPrimary : colors.borderSubtle,
                      }}>
                      <BodyText style={{ color: paymentSource === opt.value ? colors.accentPrimary : colors.textPrimary }}>{opt.label}</BodyText>
                    </Pressable>
                  ))}
                </View>
              )}
              <Button onPress={() => { hapticImpact('light'); void handleSubmit(); }} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save' : 'Add'}</Button>
            </Card>
          ) : null}

          {incomeSources.length === 0 && !showForm ? (
            <BodyText color="secondary" style={{ textAlign: 'center', marginTop: spacing.lg }}>
              No income sources yet. Tap Add to create one.
            </BodyText>
          ) : (
            incomeSources.map((source) => (
              <Card key={source.id} variant="default" padding="md" style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                      <BodyText style={{ fontWeight: '600' }}>{source.name}</BodyText>
                      {!source.is_active && (
                        <View style={{ backgroundColor: colors.bgElevated, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: 4 }}>
                          <LabelText color="secondary" style={{ fontSize: 11 }}>Paused</LabelText>
                        </View>
                      )}
                    </View>
                    <LabelText color="secondary" style={{ marginTop: 2 }}>
                      {currencySymbol(currency)}{Number(source.amount).toLocaleString('en-GB')} · {frequencySubline(source)} · {source.payment_source}
                    </LabelText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Switch
                      value={source.is_active}
                      onValueChange={() => handleToggleActive(source)}
                    />
                    <Pressable onPress={() => { hapticImpact('light'); openEdit(source); }} hitSlop={8} style={{ padding: spacing.xs }}>
                      <BodyText style={{ color: colors.accentPrimary, fontSize: 14 }}>Edit</BodyText>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        hapticImpact('light');
                        Alert.alert('Remove income source?', 'Future cycles will no longer include it. You can add it again later.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => handleDeleteConfirm(source.id) },
                        ]);
                      }}
                      hitSlop={8}
                      disabled={deletingId === source.id}
                      style={{ padding: spacing.xs }}>
                      <BodyText style={{ color: colors.error, fontSize: 14, opacity: deletingId === source.id ? 0.6 : 1 }}>Delete</BodyText>
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))
          )}

      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}
