import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, SubheadingText, BodyText, useTheme } from '@repo/native-ui';
import { currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Pot } from '@repo/supabase';

export interface PotDetailCardProps {
  pot: Pot;
  currency: CurrencyCode;
  toggling: boolean;
  onToggleComplete: () => void;
}

export function PotDetailCard({ pot, currency, toggling, onToggleComplete }: PotDetailCardProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const target = Number(pot.target_amount);
  const current = Number(pot.current_amount);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const statusLabel = pot.status === 'complete' ? 'Accomplished' : pot.status === 'paused' ? 'Paused' : 'Saving';
  const canToggle = pot.status === 'active' || pot.status === 'complete' || pot.status === 'paused';

  return (
    <Card variant="default" padding="lg" style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <BodyText style={{ fontSize: 28 }}>{pot.icon || '🏖️'}</BodyText>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SubheadingText>{pot.name}</SubheadingText>
          <Text variant="label-sm" color="secondary">{statusLabel}</Text>
        </View>
      </View>
      <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
        {currencySymbol(currency)}{current.toFixed(2)} / {currencySymbol(currency)}{target.toFixed(2)}
      </Text>
      <View
        style={{
          height: 10,
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
      <Text variant="label-sm" color="secondary">{progress.toFixed(0)}%</Text>
      {canToggle && (
        <Pressable
          onPress={() => {
            hapticImpact('light');
            onToggleComplete();
          }}
          disabled={toggling}
          style={{
            marginTop: spacing.md,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.accentPrimary,
            alignSelf: 'flex-start',
          }}>
          <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
            {toggling ? 'Updating…' : pot.status === 'complete' ? 'Mark as active' : 'Mark accomplished'}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}
