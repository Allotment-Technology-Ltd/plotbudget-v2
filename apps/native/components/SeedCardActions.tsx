import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Text, useTheme } from '@repo/native-ui';
import type { Payer } from '@/lib/mark-seed-paid';

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
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                hapticImpact('light');
                (isPaidMe ? onUnmarkPaid : onMarkPaid)?.('me');
              }}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isPaidMe ? colors.accentPrimary : colors.borderSubtle,
                backgroundColor: isPaidMe ? colors.accentPrimary + '20' : undefined,
              }}>
              <Text variant="label-sm"
                style={{
                  color: isPaidMe ? colors.accentPrimary : colors.textSecondary,
                }}>
                You {isPaidMe ? '✓' : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                hapticImpact('light');
                (isPaidPartner ? onUnmarkPaid : onMarkPaid)?.('partner');
              }}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isPaidPartner ? colors.accentPrimary : colors.borderSubtle,
                backgroundColor: isPaidPartner ? colors.accentPrimary + '20' : undefined,
              }}>
              <Text variant="label-sm"
                style={{
                  color: isPaidPartner ? colors.accentPrimary : colors.textSecondary,
                }}>
                {otherLabel} {isPaidPartner ? '✓' : ''}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              hapticImpact('light');
              (isPaid ? onUnmarkPaid : onMarkPaid)?.('both');
            }}
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isPaid ? colors.accentPrimary : colors.borderSubtle,
              backgroundColor: isPaid ? colors.accentPrimary + '20' : undefined,
            }}>
            <Text variant="label-sm"
              style={{
                color: isPaid ? colors.accentPrimary : colors.textSecondary,
              }}>
              {isPaid ? 'Unmark paid' : 'Mark paid'}
            </Text>
          </Pressable>
        ))}
      {canEditOrDelete && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.error,
          }}>
          <Text variant="label-sm" style={{ color: colors.error }}>Delete</Text>
        </Pressable>
      )}
    </View>
  );
}
