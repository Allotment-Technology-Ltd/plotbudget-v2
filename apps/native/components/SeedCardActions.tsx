import React from 'react';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { hapticImpact } from '@/lib/haptics';
import { Text, useTheme } from '@repo/native-ui';
import type { Payer } from '@/lib/mark-seed-paid';
import { SeedCardMarkPaidChip } from './SeedCardMarkPaidChip';

interface SeedCardActionsProps {
  isPaid: boolean;
  isPaidMe: boolean;
  isPaidPartner: boolean;
  isJoint: boolean;
  otherLabel: string;
  canMarkUnmark: boolean;
  canEditOrDelete: boolean;
  onMarkPaid?: (payer: Payer) => void;
  onUnmarkPaid?: (payer: Payer) => void;
  onDelete: () => void;
}

export function SeedCardActions({
  isPaid,
  isPaidMe,
  isPaidPartner,
  isJoint,
  otherLabel,
  canMarkUnmark,
  canEditOrDelete,
  onMarkPaid,
  onUnmarkPaid,
  onDelete,
}: SeedCardActionsProps) {
  const { colors, spacing } = useTheme();

  const handleDelete = () => {
    if (!canEditOrDelete) return;
    hapticImpact('medium');
    onDelete();
  };

  if (!canMarkUnmark && !canEditOrDelete) return null;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      {canMarkUnmark &&
        (isJoint ? (
          <>
            <SeedCardMarkPaidChip
              label={`YOU ${isPaidMe ? '✓' : ''}`}
              selected={isPaidMe}
              onPress={() => (isPaidMe ? onUnmarkPaid : onMarkPaid)?.('me')}
            />
            <SeedCardMarkPaidChip
              label={`${otherLabel} ${isPaidPartner ? '✓' : ''}`}
              selected={isPaidPartner}
              onPress={() => (isPaidPartner ? onUnmarkPaid : onMarkPaid)?.('partner')}
            />
          </>
        ) : (
          <SeedCardMarkPaidChip
            label={isPaid ? 'Unmark paid' : 'Mark paid'}
            selected={isPaid}
            onPress={() => (isPaid ? onUnmarkPaid : onMarkPaid)?.('both')}
          />
        ))}
      {canEditOrDelete && (
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.error,
          }}>
          <Text variant="label-sm" style={{ color: colors.error }}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
