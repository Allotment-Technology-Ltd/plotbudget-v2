import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  SeedFormDueDateField,
  SeedFormSavingsSection,
  SeedFormRepaymentSection,
  SeedFormPaymentSourceSection,
  SeedFormRecurringCheckbox,
} from './SeedFormSections';
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
  const { colors, spacing } = useTheme();
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

              <SeedFormDueDateField
                value={dueDate}
                onChange={setDueDate}
                showPicker={showDueDatePicker}
                onShowPicker={() => setShowDueDatePicker(true)}
                onHidePicker={() => setShowDueDatePicker(false)}
                cycleStartDate={cycleStartDate}
                cycleEndDate={cycleEndDate}
              />

              {category === 'savings' && (
                <SeedFormSavingsSection
                  pots={pots}
                  linkPotId={linkPotId}
                  setLinkPotId={setLinkPotId}
                  potCurrentStr={potCurrentStr}
                  setPotCurrentStr={setPotCurrentStr}
                  potTargetStr={potTargetStr}
                  setPotTargetStr={setPotTargetStr}
                  potTargetDate={potTargetDate}
                  setPotTargetDate={setPotTargetDate}
                  showPotDatePicker={showPotDatePicker}
                  setShowPotDatePicker={setShowPotDatePicker}
                  potStatus={potStatus}
                  setPotStatus={setPotStatus}
                  symbol={symbol}
                  showNewPotFields={showNewPotFields}
                />
              )}

              {category === 'repay' && (
                <SeedFormRepaymentSection
                  repayments={repayments}
                  linkRepaymentId={linkRepaymentId}
                  setLinkRepaymentId={setLinkRepaymentId}
                  repaymentCurrentStr={repaymentCurrentStr}
                  setRepaymentCurrentStr={setRepaymentCurrentStr}
                  repaymentTargetDate={repaymentTargetDate}
                  setRepaymentTargetDate={setRepaymentTargetDate}
                  showRepayDatePicker={showRepayDatePicker}
                  setShowRepayDatePicker={setShowRepayDatePicker}
                  repaymentStatus={repaymentStatus}
                  setRepaymentStatus={setRepaymentStatus}
                  symbol={symbol}
                  showNewRepayFields={showNewRepayFields}
                />
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

              {isCouple && (
                <SeedFormPaymentSourceSection
                  paymentSource={paymentSource}
                  setPaymentSource={setPaymentSource}
                  ownerLabel={ownerLabel}
                  partnerLabel={partnerLabel}
                  splitRatio={splitRatio}
                  setSplitRatio={setSplitRatio}
                  usesJointAccount={usesJointAccount}
                  setUsesJointAccount={setUsesJointAccount}
                  amountStr={amountStr}
                  symbol={symbol}
                />
              )}

              {(category === 'need' || category === 'want') && (
                <SeedFormRecurringCheckbox isRecurring={isRecurring} setIsRecurring={setIsRecurring} />
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
