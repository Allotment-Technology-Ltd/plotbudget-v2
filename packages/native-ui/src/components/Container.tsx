import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ContainerProps extends ViewProps {
  /**
   * Max width constraint (similar to web's content-wrapper)
   * - 'narrow': ~520px
   * - 'prose': ~700px  
   * - 'content': ~1200px (default)
   * - 'full': no constraint
   */
  maxWidth?: 'narrow' | 'prose' | 'content' | 'full';
  /**
   * Horizontal padding
   */
  paddingX?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Center content horizontally
   */
  centered?: boolean;
}

export function Container({
  maxWidth = 'content',
  paddingX = 'md',
  centered = true,
  style,
  children,
  ...props
}: ContainerProps) {
  const { spacing } = useTheme();

  const containerStyle: ViewStyle = {
    width: '100%',
    ...getMaxWidthStyle(maxWidth),
    ...getPaddingXStyle(paddingX, spacing),
    ...(centered && { alignSelf: 'center' }),
  };

  return (
    <View style={[containerStyle, style]} {...props}>
      {children}
    </View>
  );
}

function getMaxWidthStyle(maxWidth: ContainerProps['maxWidth']): ViewStyle {
  switch (maxWidth) {
    case 'narrow':
      return { maxWidth: 520 };
    case 'prose':
      return { maxWidth: 700 };
    case 'content':
      return { maxWidth: 1200 };
    case 'full':
    default:
      return {};
  }
}

function getPaddingXStyle(
  paddingX: ContainerProps['paddingX'],
  spacing: typeof import('@repo/design-tokens/native').spacing
): ViewStyle {
  switch (paddingX) {
    case 'none':
      return { paddingHorizontal: 0 };
    case 'sm':
      return { paddingHorizontal: spacing.md };
    case 'lg':
      return { paddingHorizontal: spacing.xl };
    case 'md':
    default:
      return { paddingHorizontal: spacing.lg };
  }
}
