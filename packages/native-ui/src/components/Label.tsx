import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text, PlotTextProps } from './Text';
import { useTheme } from '../theme/ThemeProvider';

export interface LabelProps extends Omit<PlotTextProps, 'variant'> {
  required?: boolean;
  containerStyle?: ViewStyle;
}

export function Label({
  required = false,
  containerStyle,
  children,
  ...props
}: LabelProps) {
  const { colors } = useTheme();

  return (
    <View style={containerStyle}>
      <Text variant="label-sm" color="secondary" {...props}>
        {children}
        {required && (
          <Text variant="label-sm" style={{ color: colors.error }}>
            {' *'}
          </Text>
        )}
      </Text>
    </View>
  );
}
