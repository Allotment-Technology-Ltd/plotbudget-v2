import React, { useEffect, useRef } from 'react';
import { ViewProps, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface SkeletonProps extends ViewProps {
  /** Width as number (px) or percentage string e.g. '100%' */
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
}

/**
 * Skeleton placeholder for loading states.
 * Shows a visible pulse animation so users see that content is loading.
 */
export function Skeleton({
  width,
  height = 16,
  borderRadius,
  style,
  ...props
}: SkeletonProps) {
  const { colors, borderRadius: themeRadius } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const skeletonStyle: ViewStyle = {
    width: (width ?? '100%') as ViewStyle['width'],
    height,
    borderRadius: borderRadius ?? themeRadius.DEFAULT,
    backgroundColor: colors.borderSubtle,
  };

  return (
    <Animated.View
      style={[skeletonStyle, { opacity }, style]}
      {...props}
    />
  );
}
