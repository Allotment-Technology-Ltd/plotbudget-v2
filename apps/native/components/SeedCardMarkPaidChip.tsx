import React from 'react';
import { Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Text, useTheme } from '@repo/native-ui';

interface SeedCardMarkPaidChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SeedCardMarkPaidChip({ label, selected, onPress }: SeedCardMarkPaidChipProps) {
  const { colors, spacing } = useTheme();

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation();
        hapticImpact('light');
        onPress();
      }}
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: selected ? colors.accentPrimary : colors.borderSubtle,
        backgroundColor: selected ? colors.accentPrimary + '20' : undefined,
      }}>
      <Text
        variant="label-sm"
        style={{ color: selected ? colors.accentPrimary : colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}
