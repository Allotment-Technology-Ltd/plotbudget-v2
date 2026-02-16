import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@repo/native-ui';

const SPRING_CONFIG = { damping: 12, stiffness: 200 };

export interface SuccessAnimationProps {
  /** When true, plays the animation. */
  visible: boolean;
  /** Called when the animation completes. */
  onComplete?: () => void;
  /** Size of the checkmark. Default 48. */
  size?: number;
}

/**
 * Brief checkmark animation for success feedback (mark paid, pot complete).
 */
export function SuccessAnimation({
  visible,
  onComplete,
  size = 48,
}: SuccessAnimationProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1, SPRING_CONFIG),
        withTiming(1.1, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
      opacity.value = withDelay(
        400,
        withTiming(0, { duration: 300 }, (finished) => {
          'worklet';
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
    }
  }, [visible, onComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.checkmark,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.accentPrimary,
            },
          ]}
        >
          <FontAwesome name="check" size={size * 0.5} color="#fff" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
