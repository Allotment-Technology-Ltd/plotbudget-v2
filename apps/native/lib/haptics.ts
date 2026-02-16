/**
 * Haptic feedback utilities.
 * Uses expo-haptics on native; no-op on web and when unavailable.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light impact for button presses, toggles, taps. */
export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
  if (!isNative) return;
  try {
    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(styleMap[style]);
  } catch {
    // Haptics may fail on simulators or unsupported devices
  }
}

/** Success notification for completed actions (mark paid, pot complete). */
export async function hapticSuccess(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore
  }
}

/** Selection feedback for picker/segmented control changes. */
export async function hapticSelection(): Promise<void> {
  if (!isNative) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Ignore
  }
}
