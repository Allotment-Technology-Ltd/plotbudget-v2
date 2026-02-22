/**
 * Device-specific copy for camera permission denied (and similar) errors.
 * Use with useDevice() from @/hooks/use-device in client components.
 * Import this and use getCameraPermissionDeniedCopy(deviceType) for consistent,
 * device-relevant instructions anywhere in the product (e.g. scan, video calls).
 */

import type { DeviceType } from './device';

export interface CameraPermissionDeniedCopy {
  /** Short heading */
  lead: string;
  /** Easiest alternative (e.g. "Use Upload photo") */
  alternative: string;
  /** Steps to allow camera (device + browser) */
  steps: string;
}

/**
 * Returns copy for "camera access denied" appropriate to the user's device.
 * Use with useDevice() in client components.
 */
export function getCameraPermissionDeniedCopy(deviceType: DeviceType): CameraPermissionDeniedCopy {
  switch (deviceType) {
    case 'ios':
      return {
        lead: 'Camera access wasn’t granted.',
        alternative:
          'Tap Back, then choose Upload photo and pick an image from your device — no camera needed.',
        steps:
          'To use the camera: open Settings → Privacy & Security → Camera, turn on for your browser (e.g. Safari or Chrome). Then return here and tap Try again.',
      };
    case 'android':
      return {
        lead: 'Camera access wasn’t granted.',
        alternative:
          'Tap Back, then choose Upload photo and pick an image — no camera needed.',
        steps:
          'To use the camera: open your device Settings → Apps → your browser → Permissions and allow Camera. Then return here and tap Try again.',
      };
    case 'mac':
      return {
        lead: 'Camera access wasn’t granted.',
        alternative:
          'Tap Back, then choose Upload photo and pick an image from your Mac — no camera needed.',
        steps:
          'To use the camera: allow in System Settings → Privacy & Security → Camera, and in your browser (e.g. lock icon in the address bar → Camera → Allow). Then tap Try again.',
      };
    case 'windows':
      return {
        lead: 'Camera access wasn’t granted.',
        alternative:
          'Tap Back, then choose Upload photo and pick an image from your computer — no camera needed.',
        steps:
          'To use the camera: allow in Windows Settings → Privacy → Camera, and in your browser (e.g. lock icon in the address bar → Camera → Allow). Then tap Try again.',
      };
    default:
      return {
        lead: 'Camera access wasn’t granted.',
        alternative:
          'Tap Back, then choose Upload photo and pick an image — no camera needed.',
        steps:
          'To use the camera: allow camera access in your device and browser settings, then tap Try again.',
      };
  }
}
