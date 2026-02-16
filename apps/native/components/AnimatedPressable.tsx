import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { hapticImpact } from '@/lib/haptics';

const SPRING_CONFIG = { damping: 15, stiffness: 400 };

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  /** Scale when pressed. Default 0.97. */
  activeScale?: number;
  /** Trigger haptic on press. Default true. */
  haptic?: boolean;
  /** Optional style for the wrapper. */
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Pressable with scale animation and optional haptic feedback.
 */
export function AnimatedPressable({
  activeScale = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  children,
  style,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    scale.value = withSpring(activeScale, SPRING_CONFIG);
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    scale.value = withSpring(1, SPRING_CONFIG);
    onPressOut?.(e);
  };

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (haptic) {
      hapticImpact('light');
    }
    onPress?.(e);
  };

  return (
    <Pressable
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
