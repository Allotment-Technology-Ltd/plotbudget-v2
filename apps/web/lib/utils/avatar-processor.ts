/**
 * Subtle pixelation for avatar: downscale then upscale with no smoothing.
 * Keeps original colours; block size is gentle (48×48) for a soft retro look.
 */

const PIXEL_SIZE = 48;
const DISPLAY_SIZE = 128;

/**
 * Pixelate image at 48×48 and output at 128×128. No palette change.
 * Returns a WebP data URL for preview and upload.
 */
export function pixelateAndPaletteSwap(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      canvas.width = PIXEL_SIZE;
      canvas.height = PIXEL_SIZE;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, PIXEL_SIZE, PIXEL_SIZE);

      const displayCanvas = document.createElement('canvas');
      const displayCtx = displayCanvas.getContext('2d');
      if (!displayCtx) {
        reject(new Error('Display canvas context not available'));
        return;
      }

      displayCanvas.width = DISPLAY_SIZE;
      displayCanvas.height = DISPLAY_SIZE;
      displayCtx.imageSmoothingEnabled = false;
      displayCtx.drawImage(canvas, 0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

      const dataUrl = displayCanvas.toDataURL('image/webp', 0.9);
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
