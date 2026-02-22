/**
 * Client-side device/OS detection from the user agent.
 * Use for showing device-relevant instructions (e.g. camera permissions).
 * Safe to call in browser; returns 'other' when navigator is undefined (SSR).
 */

export type DeviceType = 'ios' | 'android' | 'mac' | 'windows' | 'other';

/**
 * Parse user agent string to determine device/OS.
 * Order matters: iOS and Android are checked first (mobile); then desktop OS.
 */
export function getDeviceTypeFromUserAgent(ua: string): DeviceType {
  if (!ua || typeof ua !== 'string') return 'other';
  const u = ua;
  // iPad on iOS 13+ can report as Mac; check for iPad/iPhone first
  if (/iPad|iPhone|iPod/.test(u) && !/(MSStream)/.test(u)) return 'ios';
  if (/Android/.test(u)) return 'android';
  if (/Macintosh|Mac OS X/.test(u)) return 'mac';
  if (/Windows|Win32|Win64/.test(u)) return 'windows';
  return 'other';
}

/**
 * Get device type from the current environment (browser).
 * Returns 'other' when not in browser or during SSR.
 */
export function getDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') return 'other';
  return getDeviceTypeFromUserAgent(navigator.userAgent);
}

/**
 * Whether the device is typically mobile (phone/tablet).
 */
export function isMobileDevice(ua?: string): boolean {
  const u = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!u) return false;
  return /iPad|iPhone|iPod|Android/.test(u) && !/(MSStream)/.test(u);
}
