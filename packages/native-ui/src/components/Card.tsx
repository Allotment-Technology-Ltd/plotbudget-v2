import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type CardVariant = 'default' | 'elevated' | 'outline';

export interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  variant = 'default',
  padding = 'md',
  style,
  children,
  ...props
}: CardProps) {
  const { colors, spacing, borderRadius, shadows } = useTheme();

  const baseStyle: ViewStyle = {
    borderRadius: borderRadius.lg,
    ...getPaddingStyle(padding, spacing),
  };

  const variantStyle = getVariantStyle(variant, colors, shadows);

  return (
    <View style={[baseStyle, variantStyle, style]} {...props}>
      {children}
    </View>
  );
}

function getPaddingStyle(
  padding: CardProps['padding'],
  spacing: typeof import('@repo/design-tokens/native').spacing
): ViewStyle {
  switch (padding) {
    case 'none':
      return { padding: 0 };
    case 'sm':
      return { padding: spacing.md };
    case 'lg':
      return { padding: spacing.xl };
    case 'md':
    default:
      return { padding: spacing.lg };
  }
}

function getVariantStyle(
  variant: CardVariant,
  colors: import('@repo/design-tokens/native').ColorPalette,
  shadows: typeof import('@repo/design-tokens/native').shadows
): ViewStyle {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.bgSecondary,
        ...shadows.md,
      };

    case 'outline':
      return {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      };

    case 'default':
    default:
      return {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      };
  }
}
