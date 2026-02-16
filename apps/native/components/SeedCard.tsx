import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, BodyText, useTheme } from '@repo/native-ui';
import { currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';
import type { Payer } from '@/lib/mark-seed-paid';

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

  const handleDelete = () => {
    if (!canEditOrDelete) return;
    hapticImpact('medium');
    onDelete();
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
        </View>
      </Card>
    </Pressable>
  );
}
