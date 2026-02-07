/**
 * Auth-related feature flags and config.
 * Used when PostHog is not configured; PostHog flags override these when available.
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
