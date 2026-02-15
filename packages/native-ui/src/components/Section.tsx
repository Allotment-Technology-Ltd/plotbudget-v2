import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface SectionProps extends ViewProps {
  /**
   * Vertical padding/spacing
   * - 'sm': 16px
   * - 'md': 24px (default)
   * - 'lg': 32px
   * - 'xl': 48px
   * - '2xl': 64px
   */
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Background color
   */
  bg?: 'primary' | 'secondary' | 'elevated';
}

export function Section({
  spacing = 'md',
  bg,
  style,
  children,
  ...props
}: SectionProps) {
  const theme = useTheme();

  const sectionStyle: ViewStyle = {
    ...getSpacingStyle(spacing, theme.spacing),
    ...(bg && { backgroundColor: getBackgroundColor(bg, theme.colors) }),
  };

  return (
    <View style={[sectionStyle, style]} {...props}>
      {children}
    </View>
  );
}

function getSpacingStyle(
  spacing: SectionProps['spacing'],
  spacingTokens: typeof import('@repo/design-tokens/native').spacing
): ViewStyle {
  switch (spacing) {
    case 'sm':
      return { paddingVertical: spacingTokens.md };
    case 'lg':
      return { paddingVertical: spacingTokens.xl };
    case 'xl':
      return { paddingVertical: spacingTokens['2xl'] };
    case '2xl':
      return { paddingVertical: spacingTokens['3xl'] };
    case 'md':
    default:
      return { paddingVertical: spacingTokens.lg };
  }
}

function getBackgroundColor(
  bg: 'primary' | 'secondary' | 'elevated',
  colors: import('@repo/design-tokens/native').ColorPalette
): string {
  switch (bg) {
    case 'primary':
      return colors.bgPrimary;
    case 'secondary':
      return colors.bgSecondary;
    case 'elevated':
      return colors.bgElevated;
    default:
      return 'transparent';
  }
}
