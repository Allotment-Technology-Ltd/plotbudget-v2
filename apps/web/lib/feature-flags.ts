/**
 * Auth-related feature flags and config.
 * Used when PostHog is not configured; PostHog flags override these when available.
 *
 * For server-side (proxy, server components), use getServerFeatureFlags() from
 * lib/posthog-server-flags.ts to evaluate flags via PostHog API when configured.
 */

function getEnv(): Record<string, string | undefined> {
  if (typeof process === 'undefined') return {};
  return (process.env ?? {}) as Record<string, string | undefined>;
}

/** Direct process.env read so Next.js inlines at build time; avoids server/client mismatch (hydration). */
export function getSignupGatedFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_SIGNUP_GATED === 'true';
}

/** Direct process.env read so Next.js inlines at build time; avoids server/client mismatch (hydration). */
export function getGoogleLoginEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time; avoids server/client mismatch (hydration). */
export function getAppleLoginEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_APPLE_LOGIN_ENABLED === 'true';
}

/** When true, show "Email me a sign-in link" (magic link) on login. Can be always-on. Direct process.env for hydration. */
export function getMagicLinkEnabledFromEnv(): boolean {
  const v = process.env.NEXT_PUBLIC_MAGIC_LINK_ENABLED;
  return v === undefined || v === '' || v === 'true';
}

/** URL for "Join waitlist" when signup is gated (e.g. MailerLite form or marketing page). */
export function getWaitlistUrlFromEnv(): string {
  return getEnv().NEXT_PUBLIC_WAITLIST_URL || 'https://plotbudget.com';
}

/** Direct process.env read so Next.js inlines at build time; avoids server/client mismatch (hydration). */
export function getPricingEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_PRICING_ENABLED === 'true';
}

/** When true, show pay-what-you-like pricing model (default for new users). */
export function getPWYLPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_PWYL_PRICING_ENABLED === 'true';
}

/** When true, show fixed pricing model (£4.99/month, £49.99/year - legacy users). */
export function getFixedPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_FIXED_PRICING_ENABLED === 'true';
}

/**
 * True when running in a development context (local).
 * Uses process.env directly so Next.js can inline at build time and server/client match (avoids hydration mismatch).
 * Guard for undefined process (e.g. some edge/worker contexts).
 */
export function isDevContext(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  if (process.env.NODE_ENV === 'development') return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return appUrl.includes('localhost');
}

/**
 * True when running in a pre-production context (local, Vercel preview, or explicit APP_ENV).
 * In pre-prod we bypass PostHog for auth-related feature flags and use env vars only.
 * Uses process.env directly so Next.js can inline at build time and server/client match (avoids hydration mismatch).
 */
export function isPreProdContext(): boolean {
  if (isDevContext()) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl.includes('vercel.app')) return true;
  const appEnv = (process.env.NEXT_PUBLIC_APP_ENV ?? '').toLowerCase();
  return appEnv === 'preview' || appEnv === 'staging';
}

/**
 * Whether the trial testing dashboard is allowed (develop branch or local only).
 * Use for gating /dev/trial-testing page and API routes.
 */
export function isTrialTestingDashboardAllowed(): boolean {
  const env = getEnv();
  if (env.ENABLE_TRIAL_TESTING_DASHBOARD === 'true') return true;
  if (env.NODE_ENV === 'development') return true;
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl.includes('localhost')) return true;
  const ref = env.VERCEL_GIT_COMMIT_REF ?? '';
  return ref === 'develop';
}

/**
 * Dev-only override for payment/pricing UI (local testing).
 * Set NEXT_PUBLIC_DEV_PAYMENTS=off|pwyl|full in .env.local. Only applied when isDevContext().
 * Direct process.env read for NEXT_PUBLIC_DEV_PAYMENTS so Next.js inlines; avoids hydration mismatch.
 */
export function getDevPaymentsOverrideFromEnv(): 'off' | 'pwyl' | 'full' | null {
  if (!isDevContext()) return null;
  const v = (process.env.NEXT_PUBLIC_DEV_PAYMENTS ?? '').toLowerCase();
  if (v === 'off' || v === 'false' || v === '0') return 'off';
  if (v === 'pwyl') return 'pwyl';
  if (v === 'full' || v === 'true' || v === '1') return 'full';
  return null;
}

/**
 * Whether any payment/pricing UI should be shown (state 2 or 3).
 * When true: /pricing allowed, pricing link in user menu, Subscription tab in settings.
 * Respects NEXT_PUBLIC_DEV_PAYMENTS in dev; otherwise = !signupGated.
 */
export function getPaymentUiVisibleFromEnv(): boolean {
  const override = getDevPaymentsOverrideFromEnv();
  if (override === 'off') return false;
  if (override === 'pwyl' || override === 'full') return true;
  return !getSignupGatedFromEnv();
}

/**
 * Whether full premium pricing (fixed tiers) should be shown (state 3 only).
 * Respects NEXT_PUBLIC_DEV_PAYMENTS in dev; otherwise = pricingEnabled.
 */
export function getFullPremiumVisibleFromEnv(): boolean {
  const override = getDevPaymentsOverrideFromEnv();
  if (override === 'full') return true;
  if (override === 'off' || override === 'pwyl') return false;
  return getPricingEnabledFromEnv();
}

/**
 * Derive payment UI visibility from server flags (PostHog or env).
 * Use when you have server flags from getServerFeatureFlags().
 */
export function getPaymentUiVisibleFromServerFlags(flags: {
  signupGated: boolean;
}): boolean {
  const override = getDevPaymentsOverrideFromEnv();
  if (override === 'off') return false;
  if (override === 'pwyl' || override === 'full') return true;
  return !flags.signupGated;
}

/**
 * Derive full premium visibility from server flags.
 */
export function getFullPremiumVisibleFromServerFlags(flags: {
  pricingEnabled: boolean;
}): boolean {
  const override = getDevPaymentsOverrideFromEnv();
  if (override === 'full') return true;
  if (override === 'off' || override === 'pwyl') return false;
  return flags.pricingEnabled;
}
