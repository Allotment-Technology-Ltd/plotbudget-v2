/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@repo/logic'],
  // Avoid sharp install on Vercel (build was hanging at sharp install step).
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    // In dev, use memory-only cache so webpack doesn't serialize large strings to disk (which
    // triggers "Serializing big strings" warning). The "use Buffer" approach would require
    // changes in webpack core or plugins (e.g. mini-css-extract-plugin), not in app config.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    // Suppress the warning if it still appears (e.g. if Next overrides cache or in production).
    config.ignoreWarnings = [...(config.ignoreWarnings || []), /Serializing big strings/];
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
