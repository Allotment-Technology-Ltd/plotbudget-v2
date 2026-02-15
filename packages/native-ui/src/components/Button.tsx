import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type ButtonVariant = 'primary' | 'ghost' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  const isDisabled = disabled || isLoading;

  // Base styles
  const baseButtonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    ...getButtonSizeStyles(size, spacing),
  };

  const baseTextStyle: TextStyle = {
    fontFamily: typography.fontFamily.heading,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.cta,
    ...getTextSizeStyles(size, typography),
  };

  // Variant-specific styles
  const variantStyles = getVariantStyles(variant, colors, isDisabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        baseButtonStyle,
        variantStyles.button,
        isDisabled && styles.disabledButton,
        style,
      ]}
    >
      {isLoading ? (
        <>
          <ActivityIndicator
            color={variantStyles.text.color}
            size="small"
            style={styles.loader}
          />
          <Text style={[baseTextStyle, variantStyles.text, textStyle]}>
            Please wait...
          </Text>
        </>
      ) : (
        <Text style={[baseTextStyle, variantStyles.text, textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function getButtonSizeStyles(size: ButtonSize, spacing: typeof import('@repo/design-tokens/native').spacing): ViewStyle {
  switch (size) {
    case 'sm':
      return {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      };
    case 'lg':
      return {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
      };
    case 'md':
    default:
      return {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      };
  }
}

function getTextSizeStyles(size: ButtonSize, typography: typeof import('@repo/design-tokens/native').typography): TextStyle {
  switch (size) {
    case 'sm':
      return {
        fontSize: typography.fontSize.ctaSm,
        lineHeight: typography.fontSize.ctaSm * 1.2,
      };
    case 'lg':
      return {
        fontSize: typography.fontSize.cta,
        lineHeight: typography.fontSize.cta * 1.2,
      };
    case 'md':
    default:
      return {
        fontSize: typography.fontSize.cta,
        lineHeight: typography.fontSize.cta * 1.2,
      };
  }
}

function getVariantStyles(
  variant: ButtonVariant,
  colors: import('@repo/design-tokens/native').ColorPalette,
  isDisabled: boolean
) {
  switch (variant) {
    case 'primary':
      return {
        button: {
          backgroundColor: colors.accentPrimary,
        } as ViewStyle,
        text: {
          color: '#FFFFFF',
        } as TextStyle,
      };

    case 'ghost':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled
            ? colors.borderSubtle
            : colors.borderAccent,
        } as ViewStyle,
        text: {
          color: isDisabled ? colors.textSecondary : colors.accentPrimary,
        } as TextStyle,
      };

    case 'secondary':
      return {
        button: {
          backgroundColor: colors.bgElevated,
        } as ViewStyle,
        text: {
          color: colors.textPrimary,
        } as TextStyle,
      };

    case 'outline':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        } as ViewStyle,
        text: {
          color: colors.textPrimary,
        } as TextStyle,
      };

    default:
      return {
        button: {} as ViewStyle,
        text: {} as TextStyle,
      };
  }
}

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.5,
  },
  loader: {
    marginRight: 8,
  },
});
