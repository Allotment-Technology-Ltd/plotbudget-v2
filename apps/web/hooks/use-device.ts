'use client';

import { useSyncExternalStore } from 'react';
import { getDeviceType, isMobileDevice, type DeviceType } from '@/lib/device';

/**
 * Returns the user's device/OS and whether they're on a mobile device.
 * Safe for SSR: initial render uses 'other' / false; updates after mount.
 * Use for device-specific instructions (e.g. camera permission steps).
 */
export function useDevice(): { deviceType: DeviceType; isMobile: boolean } {
  const subscribe = (listener: () => void) => {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener('resize', listener);
    window.addEventListener('orientationchange', listener);
    return () => {
      window.removeEventListener('resize', listener);
      window.removeEventListener('orientationchange', listener);
    };
  };

  const deviceType = useSyncExternalStore<DeviceType>(
    subscribe,
    () => getDeviceType(),
    () => 'other'
  );
  const isMobile = useSyncExternalStore<boolean>(
    subscribe,
    () => isMobileDevice(),
    () => false
  );

  return { deviceType, isMobile };
}
