import React from 'react';
import { View } from 'react-native';
import { BodyText, Text, useTheme } from '@repo/native-ui';
import { currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';

export interface SeedCardContentProps {
  seed: Seed;
  currency: CurrencyCode;
  isPaid: boolean;
}

export function SeedCardContent({ seed, currency, isPaid }: SeedCardContentProps) {
  const { spacing } = useTheme();

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <BodyText style={{ marginBottom: spacing.xs }}>{seed.name}</BodyText>
      <Text variant="label-sm" color="secondary">
        {currencySymbol(currency)}
        {Number(seed.amount).toFixed(2)}
        {isPaid ? ' • Paid' : ''}
      </Text>
    </View>
  );
}
