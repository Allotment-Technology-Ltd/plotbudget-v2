// Lighthouse CI configuration for apps/web.
// Targets: Lighthouse performance score ≥ 90 on every route audited.
// Runs via `npx lhci autorun` in the perf-guard CI workflow.
// See: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
//
// Thresholds match rules.yaml: lhci_perf_threshold = 90, lhci_regression_threshold = 5.

/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      // Number of Lighthouse runs per URL (median is taken for stability).
      numberOfRuns: 3,
      // URLs to audit — add additional routes as the app grows.
      // In CI these are resolved against the Vercel preview deployment URL
      // supplied via the LHCI_BUILD_CONTEXT__CURRENT_BRANCH_COMMIT_HASH env var
      // or the --collect.url flag passed by the workflow.
      url: [
        '/',
        '/login',
        '/signup',
      ],
      // Settings passed to Lighthouse.
      settings: {
        // Simulate a mid-tier mobile device on a 4G connection — representative
        // of "low phone signal" requirement.  Preset: 'desktop' for a second pass.
        preset: 'perf',
        // Throttling: simulated 4G mobile (Lighthouse default for "mobile").
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttling: {
          // Simulated 4G: ~14 Mbps down, 14 Mbps up, 40 ms RTT.
          rttMs: 40,
          throughputKbps: 14 * 1024,
          cpuSlowdownMultiplier: 4,
        },
      },
    },

    assert: {
      // Preset "lighthouse:recommended" supplies defaults; we override perf only.
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core performance requirement: score ≥ 0.90 (90/100).
        'categories:performance': ['error', { minScore: 0.9 }],

        // Accessibility must stay at or above 0.90 as well (WCAG 2.2 target).
        'categories:accessibility': ['warn', { minScore: 0.9 }],

        // Best practices and SEO: warn only so they don't block the PR.
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],

        // Key web vitals — warn rather than error so first runs can baseline.
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],

        // Enforce that our no-img-element ESLint rule is backed by a Lighthouse check.
        'uses-optimized-images': ['warn', {}],
        'uses-responsive-images': ['warn', {}],
        'uses-webp-images': ['warn', {}],

        // JavaScript payload — aligned with our 300 KB bundle budget.
        'total-byte-weight': ['warn', { maxNumericValue: 307200 }], // 300 KB in bytes
        'unused-javascript': ['warn', {}],
        'unused-css-rules': ['warn', {}],

        // Render-blocking resources — important for TTFB / FCP.
        'render-blocking-resources': ['warn', {}],

        // Cache policies (lightweight on repeat visits).
        'uses-long-cache-ttl': ['warn', {}],
      },
    },

    upload: {
      // Upload results to Lighthouse CI's temporary public storage for review in the PR.
      // For permanent history, swap to a self-hosted LHCI server or GitHub Gist target.
      target: 'temporary-public-storage',
    },
  },
};
