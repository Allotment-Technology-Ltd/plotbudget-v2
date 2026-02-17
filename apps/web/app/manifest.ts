import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PLOT - Budget Together',
    short_name: 'PLOT',
    description:
      'The 20-minute payday ritual that replaces every awkward money conversation. For UK households - without sharing bank access.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#111111',
    theme_color: '#111111',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/apple-touch-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
