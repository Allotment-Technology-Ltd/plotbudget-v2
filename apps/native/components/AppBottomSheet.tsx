import React, { useEffect, useRef, type ReactNode } from 'react';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTheme } from '@repo/native-ui';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

export interface AppBottomSheetProps {
  /** When true, presents the sheet; when false, dismisses it. */
  visible: boolean;
  /** Called when the sheet is dismissed (user swipes down, taps backdrop, or programmatic dismiss). */
  onClose: () => void;
  /** Snap points for the sheet, e.g. ['50%', '90%']. Omit to use default. */
  snapPoints?: (string | number)[];
  /** When true, sheet height follows content. Use for compact content like confirm dialogs. */
  enableDynamicSizing?: boolean;
  /** Allow swipe down to close. Default true. */
  enablePanDownToClose?: boolean;
  /** Keyboard behavior for forms. Use 'interactive' for form sheets. */
  keyboardBehavior?: 'interactive' | 'fillParent' | 'extend';
  /** Android keyboard mode. Use 'adjustResize' for forms. */
  android_keyboardInputMode?: 'adjustResize' | 'adjustPan';
  children: ReactNode;
}

const DEFAULT_SNAP_POINTS = ['50%', '90%'];

/**
 * Wrapper around @gorhom/bottom-sheet BottomSheetModal with a controlled `visible` API.
 * Use inside BottomSheetModalProvider.
 */
export function AppBottomSheet({
  visible,
  onClose,
  snapPoints = DEFAULT_SNAP_POINTS,
  enableDynamicSizing = false,
  enablePanDownToClose = true,
  keyboardBehavior,
  android_keyboardInputMode,
  children,
}: AppBottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
    />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      keyboardBehavior={keyboardBehavior}
      android_keyboardInputMode={android_keyboardInputMode}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bgPrimary }}
      handleIndicatorStyle={{ backgroundColor: colors.borderSubtle }}
    >
      {children}
    </BottomSheetModal>
  );
}
