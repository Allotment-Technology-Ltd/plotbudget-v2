import React from 'react';
import { View } from 'react-native';
import { LabelText, useTheme } from '@repo/native-ui';

export interface SettingsSectionHeaderProps {
  title: string;
}

/**
 * Section header for Settings cards. Matches web: uppercase, tracking-wider, muted.
 */
export function SettingsSectionHeader({ title }: SettingsSectionHeaderProps) {
  const { spacing, typography } = useTheme();

  return (
    <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
      <LabelText
        color="secondary"
        fontFamily="heading"
        style={{
          fontSize: typography.fontSize.labelSm,
          textTransform: 'uppercase',
          letterSpacing: typography.letterSpacing.wider,
        }}>
        {title}
      </LabelText>
    </View>
  );
}
