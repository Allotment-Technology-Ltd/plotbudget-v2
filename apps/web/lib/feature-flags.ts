/**
 * Auth-related feature flags and config.
 * Used when PostHog is not configured; PostHog flags override these when available.
 *
 * For server-side (middleware, server components), use getServerFeatureFlags() from
 * lib/posthog-server-flags.ts to evaluate flags via PostHog API when configured.
 */

function getEnv(): Record<string, string | undefined> {
  if (typeof process === 'undefined') return {};
  return (process.env ?? {}) as Record<string, string | undefined>;
}

export function getSignupGatedFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_SIGNUP_GATED === 'true';
}

export function getGoogleLoginEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === 'true';
}

export function getAvatarEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_AVATAR_ENABLED === 'true';
}

/** URL for "Join waitlist" when signup is gated (e.g. MailerLite form or marketing page). */
export function getWaitlistUrlFromEnv(): string {
  return getEnv().NEXT_PUBLIC_WAITLIST_URL || 'https://plotbudget.com';
}

/** When true, pricing page and subscription/limit logic are enabled. Controlled by PostHog flag "pricing-enabled" when set. */
export function getPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_PRICING_ENABLED === 'true';
}

/** When true, show pay-what-you-like pricing model (default for new users). */
export function getPWYLPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_PWYL_PRICING_ENABLED === 'true';
}

/** When true, show fixed pricing model (£4.99/month, £49.99/year - legacy users). */
export function getFixedPricingEnabledFromEnv(): boolean {
  return getEnv().NEXT_PUBLIC_FIXED_PRICING_ENABLED === 'true';
}

/** True when running in a development context (local). */
export function isDevContext(): boolean {
  const env = getEnv();
  if (env.NODE_ENV === 'development') return true;
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? '';
  return appUrl.includes('localhost');
}

/**
 * Dev-only override for payment/pricing UI (local testing).
 * Set NEXT_PUBLIC_DEV_PAYMENTS=off|pwyl|full in .env.local. Only applied when isDevContext().
 */
export function getDevPaymentsOverrideFromEnv(): 'off' | 'pwyl' | 'full' | null {
  if (!isDevContext()) return null;
  const v = (getEnv().NEXT_PUBLIC_DEV_PAYMENTS ?? '').toLowerCase();
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
