'use client';

import { useState, useEffect } from 'react';
import { getDeviceType, isMobileDevice, type DeviceType } from '@/lib/device';

/**
 * Returns the user's device/OS and whether they're on a mobile device.
 * Safe for SSR: initial render uses 'other' / false; updates after mount.
 * Use for device-specific instructions (e.g. camera permission steps).
 */
export function useDevice(): { deviceType: DeviceType; isMobile: boolean } {
  const [deviceType, setDeviceType] = useState<DeviceType>('other');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setDeviceType(getDeviceType());
    setIsMobile(isMobileDevice());
  }, []);

  return { deviceType, isMobile };
}
