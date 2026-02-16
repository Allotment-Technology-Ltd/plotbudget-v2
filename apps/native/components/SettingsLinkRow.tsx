import React from 'react';
import { Pressable, View } from 'react-native';
import { BodyText, LabelText, useTheme } from '@repo/native-ui';

/** Minimum touch target: 48dp/pt (Material 48dp, Apple 44pt). */
const MIN_TOUCH_TARGET = 48;

export interface SettingsLinkRowProps {
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
  isLastInSection?: boolean;
  /** When true, no horizontal padding (use when parent already applies consistent inset). */
  noHorizontalPadding?: boolean;
}

/**
 * A tappable row for Settings that matches auth screen link styling:
 * accent (or error) color, medium weight, no underline.
 */
export function SettingsLinkRow({
  label,
  sublabel,
  onPress,
  destructive = false,
  isLastInSection = true,
  noHorizontalPadding = false,
}: SettingsLinkRowProps) {
  const { colors, spacing, typography } = useTheme();
  const linkColor = destructive ? colors.error : colors.accentPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: noHorizontalPadding ? 0 : spacing.lg,
        borderBottomWidth: isLastInSection ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
        backgroundColor: pressed ? colors.bgElevated : undefined,
        minHeight: MIN_TOUCH_TARGET,
      })}>
      <View style={{ flex: 1 }}>
        <BodyText
          fontFamily="body"
          style={{
            color: linkColor,
            fontWeight: typography.fontWeight.medium,
            fontSize: typography.fontSize.base,
          }}>
          {label}
        </BodyText>
        {sublabel != null && (
          <LabelText
            color="secondary"
            fontFamily="body"
            style={{ marginTop: 2, fontSize: typography.fontSize.sm }}>
            {sublabel}
          </LabelText>
        )}
      </View>
    </Pressable>
  );
}
