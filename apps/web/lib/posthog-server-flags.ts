/**
 * Server-side PostHog feature flag evaluation.
 * Uses the PostHog /flags API so flags work in proxy and server components.
 * Falls back to env vars when PostHog is not configured or the request fails.
 */

export type ServerFeatureFlags = {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  pricingEnabled: boolean;
};

function getEnv(): Record<string, string | undefined> {
  if (typeof process === 'undefined') return {};
  return (process.env ?? {}) as Record<string, string | undefined>;
}

function getEnvFlags(): ServerFeatureFlags {
  const env = getEnv();
  return {
    signupGated: env.NEXT_PUBLIC_SIGNUP_GATED === 'true',
    googleLoginEnabled: env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === 'true',
    pricingEnabled: env.NEXT_PUBLIC_PRICING_ENABLED === 'true',
  };
}

/**
 * Fetch feature flags from PostHog for a given distinct_id.
 * Uses project API key (NEXT_PUBLIC_POSTHOG_KEY). Works in Edge and Node.
 */
export async function getFeatureFlagsFromPostHog(
  distinctId: string
): Promise<ServerFeatureFlags | null> {
  const apiKey = getEnv().NEXT_PUBLIC_POSTHOG_KEY;
  const host = getEnv().NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';
  if (!apiKey) return null;

  const url = `${host.replace(/\/$/, '')}/flags?v=2`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'posthog-node/1.0.0',
      },
      body: JSON.stringify({
        api_key: apiKey,
        distinct_id: distinctId,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      flags?: Record<string, { enabled?: boolean }>;
      quotaLimited?: string[];
    };

    if (data.quotaLimited?.includes('feature_flags')) return null;
    const flags = data.flags ?? {};

    return {
      signupGated: flags['signup-gated']?.enabled ?? false,
      googleLoginEnabled: flags['google-login-enabled']?.enabled ?? false,
      pricingEnabled: flags['pricing-enabled']?.enabled ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Get feature flags for server use. Uses PostHog when configured, else env.
 * distinctId: user id if logged in, or anonymous id (e.g. from cookie) for anonymous users.
 */
export async function getServerFeatureFlags(
  distinctId: string | null
): Promise<ServerFeatureFlags> {
  const id = distinctId ?? 'anonymous';
  const posthogFlags = await getFeatureFlagsFromPostHog(id);
  const envFlags = getEnvFlags();

  if (posthogFlags) {
    return posthogFlags;
  }
  return envFlags;
}
