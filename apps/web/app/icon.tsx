import { ImageResponse } from 'next/og';

/**
 * PLOT logo icon for PWA manifest.
 * Dark background (#111111), mint P (#69F0AE). No visible border so PWA installs don't show a white ring.
 * Maskable variants use 80% scale (inner safe zone) so Android squircle/teardrop masks don't crop the logo.
 */
const LOGO_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#111111"/>
  <path d="M224.8 131.2H141.6C135.856 131.2 131.2 135.856 131.2 141.6V370.4C131.2 376.144 135.856 380.8 141.6 380.8H224.8C230.544 380.8 235.2 376.144 235.2 370.4V141.6C235.2 135.856 230.544 131.2 224.8 131.2Z" fill="#69F0AE"/>
  <path d="M370.4 131.2H266.4C260.656 131.2 256 135.856 256 141.6V256C256 261.744 260.656 266.4 266.4 266.4H370.4C376.144 266.4 380.8 261.744 380.8 256V141.6C380.8 135.856 376.144 131.2 370.4 131.2Z" fill="#69F0AE"/>
</svg>`;

export function generateImageMetadata() {
  return [
    { id: '192', contentType: 'image/png', size: { width: 192, height: 192 } },
    { id: '512', contentType: 'image/png', size: { width: 512, height: 512 } },
    {
      id: '192-maskable',
      contentType: 'image/png',
      size: { width: 192, height: 192 },
    },
    {
      id: '512-maskable',
      contentType: 'image/png',
      size: { width: 512, height: 512 },
    },
  ];
}

export default async function Icon({
  id,
}: {
  id: Promise<string>;
}) {
  const iconId = await id;
  const isMaskable = iconId.includes('maskable');
  const size = iconId.startsWith('512') ? 512 : 192;

  // Maskable: logo in inner 80% (safe zone) so Android squircle/teardrop doesn't crop
  const logoSize = isMaskable ? Math.round(size * 0.8) : size;

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
          width={logoSize}
          height={logoSize}
          alt="PLOT"
          style={{ display: 'block' }}
        />
      </div>
    ),
    { width: size, height: size }
  );
}
