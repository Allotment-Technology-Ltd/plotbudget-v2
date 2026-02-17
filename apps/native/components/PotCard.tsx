import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, BodyText, LabelText, Text, useTheme } from '@repo/native-ui';
import { formatCurrency, type CurrencyCode } from '@repo/logic';
import type { Pot, Seed } from '@repo/supabase';

type PotStatus = 'active' | 'complete' | 'paused';

export interface PotCardProps {
  pot: Pot;
  currency: CurrencyCode;
  effectiveStatus: PotStatus;
  onMarkComplete: (potId: string, status: 'complete' | 'active') => void;
  /** When provided, show an Edit button to edit the linked savings seed (monthly amount), like bill categories. */
  linkedSeed?: Seed | null;
  onEdit?: (seed: Seed) => void;
}

export function PotCard({
  pot,
  currency,
  effectiveStatus,
  onMarkComplete,
  linkedSeed,
  onEdit,
}: PotCardProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const progress =
    pot.target_amount > 0
      ? Math.min(100, (pot.current_amount / pot.target_amount) * 100)
      : 0;
  const status =
    effectiveStatus === 'complete'
      ? 'Accomplished'
      : effectiveStatus === 'paused'
        ? 'Paused'
        : 'Saving';
  const canToggle =
    effectiveStatus === 'active' || effectiveStatus === 'complete' || effectiveStatus === 'paused';
  const nextStatus = effectiveStatus === 'complete' ? 'active' : 'complete';
  const canEdit = !!linkedSeed && !!onEdit;

  return (
    <Card variant="default" padding="md" style={{ marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
          <BodyText style={{ fontSize: 20 }}>{pot.icon || '🏖️'}</BodyText>
          <LabelText>{pot.name}</LabelText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {canEdit && (
            <Pressable
              onPress={() => {
                hapticImpact('light');
                onEdit(linkedSeed!);
              }}
              hitSlop={8}
              style={{
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}>
              <Text variant="label-sm" color="secondary">Edit</Text>
            </Pressable>
          )}
          {canToggle && (
            <Pressable
              onPress={() => {
                hapticImpact('light');
                onMarkComplete(pot.id, nextStatus);
              }}
              hitSlop={8}
              style={{
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.accentPrimary,
              }}>
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                {effectiveStatus === 'complete' ? 'Active' : 'Done'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
        {formatCurrency(pot.current_amount, currency)} / {formatCurrency(pot.target_amount, currency)}
      </Text>
      <View
        style={{
          height: 8,
          backgroundColor: colors.borderSubtle,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
          marginBottom: spacing.xs,
        }}>
        <View
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: colors.savings,
            borderRadius: borderRadius.full,
          }}
        />
      </View>
      <Text variant="label-sm" color="secondary">
        {progress.toFixed(0)}% — {status}
      </Text>
    </Card>
  );
}
