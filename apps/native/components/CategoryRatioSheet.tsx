import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { hapticImpact } from '@/lib/haptics';
import {
  Container,
  Section,
  Card,
  Text,
  BodyText,
  LabelText,
  Input,
  useTheme,
} from '@repo/native-ui';
import type { Household } from '@repo/supabase';
import { AppBottomSheet } from './AppBottomSheet';
import { updateHouseholdPercentagesApi } from '@/lib/household-api';

export interface CategoryRatioSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  household: Household & { needs_percent?: number; wants_percent?: number; savings_percent?: number; repay_percent?: number };
}

export function CategoryRatioSheet({
  visible,
  onClose,
  onSuccess,
  household,
}: CategoryRatioSheetProps) {
  const { colors, spacing, borderRadius } = useTheme();
  const [needs, setNeeds] = useState(household.needs_percent ?? 50);
  const [wants, setWants] = useState(household.wants_percent ?? 30);
  const [savings, setSavings] = useState(household.savings_percent ?? 10);
  const [repay, setRepay] = useState(household.repay_percent ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setNeeds(household.needs_percent ?? 50);
      setWants(household.wants_percent ?? 30);
      setSavings(household.savings_percent ?? 10);
      setRepay(household.repay_percent ?? 10);
      setError(null);
    }
  }, [visible, household]);

  const total = needs + wants + savings + repay;
  const isValid = Math.abs(total - 100) <= 0.01;

  const handleSave = async () => {
    if (!isValid) {
      setError('Percentages must total 100%');
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await updateHouseholdPercentagesApi(household.id, {
      needs_percent: Math.round(needs),
      wants_percent: Math.round(wants),
      savings_percent: Math.round(savings),
      repay_percent: Math.round(repay),
    });
    setSubmitting(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    hapticImpact('light');
    onSuccess();
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['50%', '85%']}
      keyboardBehavior="interactive"
      android_keyboardInputMode="adjustResize">
      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Container paddingX="md">
          <Section spacing="md">
            <Text variant="headline-sm" style={{ marginBottom: spacing.xs }}>Edit category split</Text>
            <BodyText color="secondary" style={{ marginBottom: spacing.md }}>
              Adjust how you allocate your income across categories. Must total 100%.
            </BodyText>
            <View style={{ gap: spacing.md }}>
              <View>
                <LabelText style={{ marginBottom: spacing.xs }}>Needs (%)</LabelText>
                <Input
                  value={String(needs)}
                  onChangeText={(t) => setNeeds(Number(t) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
              <View>
                <LabelText style={{ marginBottom: spacing.xs }}>Wants (%)</LabelText>
                <Input
                  value={String(wants)}
                  onChangeText={(t) => setWants(Number(t) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
              <View>
                <LabelText style={{ marginBottom: spacing.xs }}>Savings (%)</LabelText>
                <Input
                  value={String(savings)}
                  onChangeText={(t) => setSavings(Number(t) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
              <View>
                <LabelText style={{ marginBottom: spacing.xs }}>Repayments (%)</LabelText>
                <Input
                  value={String(repay)}
                  onChangeText={(t) => setRepay(Number(t) || 0)}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>
            <Text
              variant="body-sm"
              style={{
                marginTop: spacing.sm,
                color: !isValid ? colors.warning : colors.textSecondary,
              }}>
              Total: {total}%
            </Text>
            {error && (
              <Card variant="default" padding="md" style={{ marginTop: spacing.sm, borderWidth: 1, borderColor: colors.warning }}>
                <Text variant="body-sm" style={{ color: colors.warning }}>{error}</Text>
              </Card>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <Pressable
                onPress={() => { hapticImpact('light'); onClose(); }}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                }}>
                <Text variant="label-sm" color="secondary">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={!isValid || submitting}
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: isValid ? colors.accentPrimary : colors.borderSubtle,
                  alignItems: 'center',
                }}>
                <Text variant="label-sm" style={{ color: isValid ? colors.bgPrimary : colors.textSecondary }}>
                  {submitting ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </Section>
        </Container>
      </BottomSheetScrollView>
    </AppBottomSheet>
  );
}
