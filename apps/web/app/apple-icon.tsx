import { ImageResponse } from 'next/og';

/**
 * Apple touch icon for macOS Dock and iOS home screen.
 * Dark background (#111111), mint P (#69F0AE). No visible border for clean install icon.
 */
const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#111111"/>
  <path d="M224.8 131.2H141.6C135.856 131.2 131.2 135.856 131.2 141.6V370.4C131.2 376.144 135.856 380.8 141.6 380.8H224.8C230.544 380.8 235.2 376.144 235.2 370.4V141.6C235.2 135.856 230.544 131.2 224.8 131.2Z" fill="#69F0AE"/>
  <path d="M370.4 131.2H266.4C260.656 131.2 256 135.856 256 141.6V256C256 261.744 260.656 266.4 266.4 266.4H370.4C376.144 266.4 380.8 261.744 380.8 256V141.6C380.8 135.856 376.144 131.2 370.4 131.2Z" fill="#69F0AE"/>
</svg>`;

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111111',
        }}
      >
        <img
          src={`data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`}
          width={180}
          height={180}
          alt="PLOT"
          style={{ display: 'block' }}
        />
      </div>
    ),
    { ...size }
  );
}
