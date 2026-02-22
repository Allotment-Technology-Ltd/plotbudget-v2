/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/ui', '@repo/logic', '@repo/supabase'],
  // Avoid sharp install on Vercel (build was hanging at sharp install step).
  images: { unoptimized: true },
  // So preview (and client code) use current deployment URL; Production should set NEXT_PUBLIC_APP_URL in Vercel.
  // NEXT_PUBLIC_VERCEL_ENV lets isPreProdContext() detect preview (admin flag overrides, env-based flags).
  env: {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV,
  },
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
    // HSTS: enforce HTTPS (browsers ignore on localhost)
    const hsts = 'max-age=31536000; includeSubDomains; preload';

    // CSP: allow self, Supabase, PostHog, Polar, Vercel; Next.js needs unsafe-inline for scripts/styles
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://eu.posthog.com https://app.posthog.com https://*.posthog.com https://polar.sh https://*.polar.sh https://api.polar.sh https://sandbox-api.polar.sh https://sandbox.polar.sh https://vitals.vercel-insights.com",
      "frame-src https://polar.sh https://sandbox.polar.sh",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: hsts },
          { key: 'Content-Security-Policy', value: csp },
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

export default nextConfig;
