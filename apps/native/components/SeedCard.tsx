import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, useTheme } from '@repo/native-ui';
import type { CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';
import type { Payer } from '@/lib/mark-seed-paid';
import { useSeedCardCapabilities } from '@/lib/use-seed-card-capabilities';
import { SeedCardContent } from './SeedCardContent';
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
  const { isPaid, canMarkUnmark, canEditOrDelete } = useSeedCardCapabilities(
    seed,
    isRitualMode,
    isCycleLocked,
    onMarkPaid,
    onUnmarkPaid
  );

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
          <SeedCardContent seed={seed} currency={currency} isPaid={isPaid} />
          <SeedCardActions
            isPaid={isPaid}
            isPaidMe={!!seed.is_paid_me}
            isPaidPartner={!!seed.is_paid_partner}
            isJoint={isJoint}
            otherLabel={otherLabel}
            canMarkUnmark={canMarkUnmark}
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
