'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Container,
  Section,
  Card,
  HeadlineText,
  BodyText,
  LabelText,
  Input,
  Button,
  useTheme,
} from '@repo/native-ui';
import { parseIncome } from '@repo/logic';
import type { Seed, Pot, Repayment, PayCycle, Household } from '@repo/supabase';
import { createSeedApi, updateSeedApi } from '@/lib/seed-api';

type SeedType = 'need' | 'want' | 'savings' | 'repay';

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
  repay: 'e.g. Credit card',
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
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [linkPotId, setLinkPotId] = useState<string | null>(null);
  const [linkRepaymentId, setLinkRepaymentId] = useState<string | null>(null);
  const [potCurrentStr, setPotCurrentStr] = useState('');
  const [potTargetStr, setPotTargetStr] = useState('');
  const [repaymentCurrentStr, setRepaymentCurrentStr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editMode = !!seed;
  const currency = household?.currency ?? 'GBP';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€';

  useEffect(() => {
    if (visible) {
      setError(null);
      if (seed) {
        setName(seed.name ?? '');
        setAmountStr(seed.amount ? String(seed.amount) : '');
        setDueDate((seed as { due_date?: string }).due_date ?? '');
        setLinkPotId(seed.linked_pot_id ?? null);
        setLinkRepaymentId(seed.linked_repayment_id ?? null);
        const linkedPot = seed.linked_pot_id ? pots.find((p) => p.id === seed.linked_pot_id) : null;
        const linkedRep = seed.linked_repayment_id
          ? repayments.find((r) => r.id === seed.linked_repayment_id)
          : null;
        setPotCurrentStr(linkedPot ? String(linkedPot.current_amount) : '');
        setPotTargetStr(linkedPot ? String(linkedPot.target_amount) : '');
        setRepaymentCurrentStr(linkedRep ? String(linkedRep.current_balance) : '');
      } else {
        setName('');
        setAmountStr('');
        setDueDate('');
        setLinkPotId(null);
        setLinkRepaymentId(null);
        setPotCurrentStr('');
        setPotTargetStr('');
        setRepaymentCurrentStr('');
      }
    }
  }, [visible, seed, pots, repayments]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    const amount = parseIncome(amountStr);
    if (!Number.isFinite(amount) || amount < 0.01) {
      setError('Amount must be greater than 0');
      return;
    }
    if (dueDate && (dueDate < paycycle.start_date || dueDate > paycycle.end_date)) {
      setError(`Due date must be within ${paycycle.start_date} – ${paycycle.end_date}`);
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
        };
        if (category === 'savings' && seed.linked_pot_id) {
          payload.pot = {
            current_amount: parseIncome(potCurrentStr) || 0,
            target_amount: parseIncome(potTargetStr) || 0,
            target_date: null,
            status: 'active' as const,
          };
        } else if (category === 'savings' && (linkPotId || parseIncome(potTargetStr) > 0)) {
          payload.linked_pot_id = linkPotId;
          if (!linkPotId) {
            payload.pot = {
              current_amount: parseIncome(potCurrentStr) || 0,
              target_amount: parseIncome(potTargetStr) || 0,
              target_date: null,
              status: 'active' as const,
            };
          }
        }
        if (category === 'repay' && seed.linked_repayment_id) {
          payload.repayment = {
            current_balance: parseIncome(repaymentCurrentStr) || 0,
            target_date: null,
            status: 'active' as const,
          };
        } else if (category === 'repay' && (linkRepaymentId || parseIncome(repaymentCurrentStr) > 0)) {
          payload.linked_repayment_id = linkRepaymentId;
          if (!linkRepaymentId) {
            payload.repayment = {
              current_balance: parseIncome(repaymentCurrentStr) || 0,
              target_date: null,
              status: 'active' as const,
            };
          }
        }
        const result = await updateSeedApi(seed.id, payload as Parameters<typeof updateSeedApi>[1]);
        if ('error' in result) {
          setError(result.error);
          return;
        }
      } else {
        const payload: Record<string, unknown> = {
          name: trimmedName,
          amount,
          type: category,
          payment_source: 'me' as const,
          paycycle_id: paycycle.id,
          household_id: household.id,
          is_recurring: true,
          due_date: dueDate.trim() || null,
        };
        if (category === 'savings') {
          if (linkPotId) {
            payload.linked_pot_id = linkPotId;
          } else if (parseIncome(potTargetStr) > 0) {
            payload.pot = {
              current_amount: parseIncome(potCurrentStr) || 0,
              target_amount: parseIncome(potTargetStr) || 0,
              target_date: null,
              status: 'active' as const,
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
              target_date: null,
              status: 'active' as const,
            };
          }
        }
        const result = await createSeedApi(payload as unknown as Parameters<typeof createSeedApi>[0]);
        if ('error' in result) {
          setError(result.error);
          return;
        }
      }
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <Container paddingX="md">
            <Section spacing="lg">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <HeadlineText>
                  {editMode ? `Edit ${CATEGORY_LABELS[category]}` : `Add ${CATEGORY_LABELS[category]}`}
                </HeadlineText>
                <Pressable onPress={onClose} hitSlop={12}>
                  <BodyText color="secondary">Cancel</BodyText>
                </Pressable>
              </View>

              {error && (
                <Card variant="default" padding="sm" style={{ marginBottom: spacing.md, borderColor: colors.error }}>
                  <BodyText color="error">{error}</BodyText>
                </Card>
              )}

              <View style={{ marginBottom: spacing.md }}>
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Name</LabelText>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder={NAME_PLACEHOLDERS[category]}
                  autoCapitalize="none"
                />
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
                <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Due date (optional)</LabelText>
                <Input
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder={`${paycycle.start_date} – ${paycycle.end_date}`}
                />
              </View>

              {category === 'savings' && (
                <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Savings goal (optional)</LabelText>
                  {pots.length > 0 && (
                    <View style={{ marginBottom: spacing.sm }}>
                      <LabelText color="secondary" style={{ marginBottom: spacing.xs, fontSize: 12 }}>Link to pot</LabelText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                        <Pressable
                          onPress={() => setLinkPotId(null)}
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: 8,
                            marginRight: spacing.sm,
                            backgroundColor: !linkPotId ? colors.accentPrimary : colors.bgElevated,
                          }}>
                          <BodyText style={{ color: !linkPotId ? '#fff' : colors.textPrimary }}>New</BodyText>
                        </Pressable>
                        {pots.map((p) => (
                          <Pressable
                            key={p.id}
                            onPress={() => setLinkPotId(p.id)}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: 8,
                              marginRight: spacing.sm,
                              backgroundColor: linkPotId === p.id ? colors.accentPrimary : colors.bgElevated,
                            }}>
                            <BodyText style={{ color: linkPotId === p.id ? '#fff' : colors.textPrimary }}>{p.name}</BodyText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {(!linkPotId || (editMode && seed?.linked_pot_id)) && (
                    <>
                      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                        <View style={{ flex: 1 }}>
                          <LabelText color="secondary" style={{ marginBottom: spacing.xs, fontSize: 12 }}>Current</LabelText>
                          <Input
                            value={potCurrentStr}
                            onChangeText={(v) => setPotCurrentStr(v.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <LabelText color="secondary" style={{ marginBottom: spacing.xs, fontSize: 12 }}>Target</LabelText>
                          <Input
                            value={potTargetStr}
                            onChangeText={(v) => setPotTargetStr(v.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </>
                  )}
                </Card>
              )}

              {category === 'repay' && (
                <Card variant="default" padding="md" style={{ marginBottom: spacing.md }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Debt (optional)</LabelText>
                  {repayments.length > 0 && (
                    <View style={{ marginBottom: spacing.sm }}>
                      <LabelText color="secondary" style={{ marginBottom: spacing.xs, fontSize: 12 }}>Link to repayment</LabelText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                        <Pressable
                          onPress={() => setLinkRepaymentId(null)}
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: 8,
                            marginRight: spacing.sm,
                            backgroundColor: !linkRepaymentId ? colors.accentPrimary : colors.bgElevated,
                          }}>
                          <BodyText style={{ color: !linkRepaymentId ? '#fff' : colors.textPrimary }}>New</BodyText>
                        </Pressable>
                        {repayments.map((r) => (
                          <Pressable
                            key={r.id}
                            onPress={() => setLinkRepaymentId(r.id)}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: 8,
                              marginRight: spacing.sm,
                              backgroundColor: linkRepaymentId === r.id ? colors.accentPrimary : colors.bgElevated,
                            }}>
                            <BodyText style={{ color: linkRepaymentId === r.id ? '#fff' : colors.textPrimary }}>{r.name}</BodyText>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {(!linkRepaymentId || (editMode && seed?.linked_repayment_id)) && (
                    <View>
                      <LabelText color="secondary" style={{ marginBottom: spacing.xs, fontSize: 12 }}>Balance</LabelText>
                      <Input
                        value={repaymentCurrentStr}
                        onChangeText={(v) => setRepaymentCurrentStr(v.replace(/[^0-9.]/g, ''))}
                        placeholder="0"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  )}
                </Card>
              )}

              <Button onPress={handleSubmit} isLoading={submitting} disabled={submitting}>
                {editMode ? 'Save' : 'Add'}
              </Button>
            </Section>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
