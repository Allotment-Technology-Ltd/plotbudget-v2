import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  inputStyle,
  disabled = false,
  ...props
}: InputProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const inputContainerStyle: ViewStyle = {
    borderWidth: 1,
    borderColor: error
      ? colors.error
      : isFocused
      ? colors.accentPrimary
      : colors.borderSubtle,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: disabled ? colors.bgElevated : colors.bgSecondary,
  };

  const textInputStyle: TextStyle = {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
    color: disabled ? colors.textSecondary : colors.textPrimary,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          variant="label-sm"
          color="secondary"
          style={{ marginBottom: spacing.xs }}
        >
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        <TextInput
          style={[textInputStyle, inputStyle]}
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>

      {error && (
        <Text
          variant="body-sm"
          color="error"
          style={{ marginTop: spacing.xs }}
        >
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text
          variant="body-sm"
          color="secondary"
          style={{ marginTop: spacing.xs }}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
