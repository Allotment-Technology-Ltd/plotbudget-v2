import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, BodyText, useTheme } from '@repo/native-ui';
import { currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';
import type { Payer } from '@/lib/mark-seed-paid';
import { SeedCardActions } from './SeedCardActions';

export interface SeedCardProps {
  seed: Seed & { is_paid_me?: boolean; is_paid_partner?: boolean };
  currency: CurrencyCode;
  isRitualMode: boolean;
  isCycleLocked: boolean;
  isJoint: boolean;
  otherLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid?: (payer: Payer) => void;
  onUnmarkPaid?: (payer: Payer) => void;
}

export function SeedCard({
  seed,
  currency,
  isRitualMode,
  isCycleLocked,
  isJoint,
  otherLabel,
  onEdit,
  onDelete,
  onMarkPaid,
  onUnmarkPaid,
}: SeedCardProps) {
  const { colors, spacing } = useTheme();
  const isPaid = !!seed.is_paid;
  const isPaidMe = !!seed.is_paid_me;
  const isPaidPartner = !!seed.is_paid_partner;
  const canMarkUnmark = !isCycleLocked && isRitualMode && (onMarkPaid || onUnmarkPaid);
  const canEditOrDelete = !isCycleLocked && (!isRitualMode || !isPaid);

  const handleEdit = () => {
    if (!canEditOrDelete) return;
    hapticImpact('light');
    onEdit();
  };

  return (
    <Pressable onPress={handleEdit} disabled={!canEditOrDelete}>
      <Card
        variant="default"
        padding="md"
        style={{
          marginBottom: spacing.sm,
          borderWidth: isPaid && isRitualMode ? 2 : 1,
          borderColor: isPaid && isRitualMode ? colors.accentPrimary + '80' : colors.borderSubtle,
          backgroundColor: isPaid && isRitualMode ? colors.accentPrimary + '0D' : undefined,
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <BodyText style={{ marginBottom: spacing.xs }}>{seed.name}</BodyText>
            <Text variant="label-sm" color="secondary">
              {currencySymbol(currency)}
              {Number(seed.amount).toFixed(2)}
              {isPaid ? ' • Paid' : ''}
            </Text>
          </View>
          <SeedCardActions
            isPaid={isPaid}
            isPaidMe={isPaidMe}
            isPaidPartner={isPaidPartner}
            isJoint={isJoint}
            otherLabel={otherLabel}
            canMarkUnmark={!!canMarkUnmark}
            canEditOrDelete={canEditOrDelete}
            onMarkPaid={onMarkPaid}
            onUnmarkPaid={onUnmarkPaid}
            onDelete={onDelete}
          />
        </View>
      </Card>
    </Pressable>
  );
}
