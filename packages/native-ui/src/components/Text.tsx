import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type TextVariant =
  | 'display-lg'
  | 'display-sm'
  | 'headline'
  | 'headline-sm'
  | 'sub'
  | 'sub-sm'
  | 'body'
  | 'body-sm'
  | 'label'
  | 'label-sm'
  | 'cta'
  | 'cta-sm';

export interface PlotTextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning';
  fontFamily?: 'display' | 'heading' | 'body';
}

export function Text({
  variant = 'body',
  color = 'primary',
  fontFamily,
  style,
  children,
  ...props
}: PlotTextProps) {
  const { colors, typography } = useTheme();

  const variantStyle = getVariantStyle(variant, typography);
  const colorStyle = getColorStyle(color, colors);
  const fontFamilyStyle = fontFamily ? { fontFamily: typography.fontFamily[fontFamily] } : {};

  return (
    <RNText
      style={[variantStyle, colorStyle, fontFamilyStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Semantic text components
export function DisplayText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="display-lg" {...props} />;
}

export function HeadlineText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="headline" {...props} />;
}

export function SubheadingText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="sub" {...props} />;
}

export function BodyText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="body" {...props} />;
}

export function LabelText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="label" {...props} />;
}

export function CTAText(props: Omit<PlotTextProps, 'variant'>) {
  return <Text variant="cta" {...props} />;
}

function getVariantStyle(
  variant: TextVariant,
  typography: typeof import('@repo/design-tokens/native').typography
) {
  switch (variant) {
    case 'display-lg':
      return {
        fontFamily: typography.fontFamily.display,
        fontSize: typography.fontSize.displayLg,
        lineHeight: typography.fontSize.displayLg * typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.ultraWide,
        textTransform: 'uppercase' as const,
      };

    case 'display-sm':
      return {
        fontFamily: typography.fontFamily.display,
        fontSize: typography.fontSize.displaySm,
        lineHeight: typography.fontSize.displaySm * typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.widest,
        textTransform: 'uppercase' as const,
      };

    case 'headline':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.headline,
        lineHeight: typography.fontSize.headline * typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.wider,
        textTransform: 'uppercase' as const,
      };

    case 'headline-sm':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.headlineSm,
        lineHeight: typography.fontSize.headlineSm * typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.wider,
        textTransform: 'uppercase' as const,
      };

    case 'sub':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.sub,
        lineHeight: typography.fontSize.sub * typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wide,
      };

    case 'sub-sm':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.subSm,
        lineHeight: typography.fontSize.subSm * typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.wide,
      };

    case 'body':
      return {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.normal,
      };

    case 'body-sm':
      return {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.normal,
      };

    case 'label':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.label,
        lineHeight: typography.fontSize.label * typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.label,
        textTransform: 'uppercase' as const,
      };

    case 'label-sm':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.labelSm,
        lineHeight: typography.fontSize.labelSm * typography.lineHeight.relaxed,
        letterSpacing: typography.letterSpacing.label,
        textTransform: 'uppercase' as const,
      };

    case 'cta':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.cta,
        lineHeight: typography.fontSize.cta * 1,
        letterSpacing: typography.letterSpacing.cta,
        textTransform: 'uppercase' as const,
      };

    case 'cta-sm':
      return {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.ctaSm,
        lineHeight: typography.fontSize.ctaSm * 1,
        letterSpacing: typography.letterSpacing.label,
        textTransform: 'uppercase' as const,
      };

    default:
      return {};
  }
}

function getColorStyle(
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning',
  colors: import('@repo/design-tokens/native').ColorPalette
) {
  switch (color) {
    case 'primary':
      return { color: colors.textPrimary };
    case 'secondary':
      return { color: colors.textSecondary };
    case 'accent':
      return { color: colors.accentPrimary };
    case 'success':
      return { color: colors.success };
    case 'error':
      return { color: colors.error };
    case 'warning':
      return { color: colors.warning };
    default:
      return { color: colors.textPrimary };
  }
}
