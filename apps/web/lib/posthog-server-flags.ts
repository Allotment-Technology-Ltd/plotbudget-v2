/**
 * Server-side PostHog feature flag evaluation.
 * Uses the PostHog /flags API so flags work in proxy and server components.
 * Falls back to env vars when PostHog is not configured or the request fails.
 * In pre-production, admins can override flags via cookie (set from /admin/flags).
 */

import { isPreProdContext } from '@/lib/feature-flags';
import {
  getModuleFlagsFromEnv,
  type ModuleFlags,
  type ModuleFlagId,
} from './module-flags';

/** Cookie set by admin flag overrides page (pre-production only). */
export const ADMIN_FLAG_OVERRIDE_COOKIE = 'plot-admin-flag-overrides';

export type ServerFeatureFlags = {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  pricingEnabled: boolean;
  moduleFlags: ModuleFlags;
};

/** PostHog flag key for each module (must match PostHog dashboard). */
const MODULE_FLAG_KEYS: Record<ModuleFlagId, string> = {
  money: 'module-money',
  home: 'module-home',
  tasks: 'module-tasks',
  calendar: 'module-calendar',
  meals: 'module-meals',
  holidays: 'module-holidays',
  vault: 'module-vault',
  kids: 'module-kids',
};

function getEnv(): Record<string, string | undefined> {
  if (typeof process === 'undefined') return {};
  return (process.env ?? {}) as Record<string, string | undefined>;
}

/** Env-based flags fallback when PostHog is unavailable or throws (e.g. in tests or edge runtime). */
export function getEnvFlags(): ServerFeatureFlags {
  const env = getEnv();
  return {
    signupGated: env.NEXT_PUBLIC_SIGNUP_GATED === 'true',
    googleLoginEnabled: env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === 'true',
    pricingEnabled: env.NEXT_PUBLIC_PRICING_ENABLED === 'true',
    moduleFlags: getModuleFlagsFromEnv(),
  };
}

/** Parsed admin override payload (module flags only; auth flags stay from PostHog/env). */
export type AdminFlagOverrides = Partial<ModuleFlags>;

/** In production, admins see all modules regardless of PostHog/env flags. */
const ALL_MODULES_ENABLED: ModuleFlags = {
  money: true,
  home: true,
  tasks: true,
  calendar: true,
  meals: true,
  holidays: true,
  vault: true,
  kids: true,
};

function parseAdminOverrideCookie(
  cookies: { get: (name: string) => { value: string } | undefined }
): AdminFlagOverrides | null {
  const raw = cookies.get(ADMIN_FLAG_OVERRIDE_COOKIE)?.value;
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return null;
    const out: AdminFlagOverrides = {};
    const keys: ModuleFlagId[] = ['money', 'home', 'tasks', 'calendar', 'meals', 'holidays', 'vault', 'kids'];
    for (const k of keys) {
      if (k in parsed && typeof (parsed as Record<string, unknown>)[k] === 'boolean') {
        out[k] = (parsed as Record<string, boolean>)[k];
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

function mergeAdminOverrides(base: ServerFeatureFlags, overrides: AdminFlagOverrides): ServerFeatureFlags {
  return {
    ...base,
    moduleFlags: { ...base.moduleFlags, ...overrides },
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

    const moduleFlags: ModuleFlags = {
      money: flags[MODULE_FLAG_KEYS.money]?.enabled ?? true,
      home: flags[MODULE_FLAG_KEYS.home]?.enabled ?? false,
      tasks: flags[MODULE_FLAG_KEYS.tasks]?.enabled ?? false,
      calendar: flags[MODULE_FLAG_KEYS.calendar]?.enabled ?? false,
      meals: flags[MODULE_FLAG_KEYS.meals]?.enabled ?? false,
      holidays: flags[MODULE_FLAG_KEYS.holidays]?.enabled ?? false,
      vault: flags[MODULE_FLAG_KEYS.vault]?.enabled ?? false,
      kids: flags[MODULE_FLAG_KEYS.kids]?.enabled ?? false,
    };

    return {
      signupGated: flags['signup-gated']?.enabled ?? false,
      googleLoginEnabled: flags['google-login-enabled']?.enabled ?? false,
      pricingEnabled: flags['pricing-enabled']?.enabled ?? false,
      moduleFlags,
    };
  } catch {
    return null;
  }
}

export type GetServerFeatureFlagsOptions = {
  /** Request cookies; when provided with isAdmin in pre-prod, admin overrides are applied. */
  cookies?: { get: (name: string) => { value: string } | undefined };
  /** When true and in pre-prod, cookie overrides (from /admin/flags) are merged. */
  isAdmin?: boolean;
};

/**
 * Get feature flags for server use. Uses PostHog when configured, else env.
 * In pre-production, if options.cookies and options.isAdmin are set, merges admin overrides from cookie.
 * distinctId: user id if logged in, or anonymous id (e.g. from cookie) for anonymous users.
 */
export async function getServerFeatureFlags(
  distinctId: string | null,
  options?: GetServerFeatureFlagsOptions
): Promise<ServerFeatureFlags> {
  const id = distinctId ?? 'anonymous';
  const posthogFlags = await getFeatureFlagsFromPostHog(id);
  const envFlags = getEnvFlags();
  let base: ServerFeatureFlags = posthogFlags ?? envFlags;

  // In production, admins bypass module feature flags: all modules enabled
  if (!isPreProdContext() && options?.isAdmin === true) {
    base = { ...base, moduleFlags: ALL_MODULES_ENABLED };
  } else if (isPreProdContext() && options?.isAdmin === true && options?.cookies) {
    const overrides = parseAdminOverrideCookie(options.cookies);
    if (overrides) base = mergeAdminOverrides(base, overrides);
  }

  return base;
}

/**
 * Get module flags for server use (nav, layout). Uses PostHog when configured, else env.
 * Pass options when in a context that has cookies (e.g. dashboard layout) so admin overrides apply in pre-prod.
 */
export async function getServerModuleFlags(
  distinctId: string | null,
  options?: GetServerFeatureFlagsOptions
): Promise<ModuleFlags> {
  const flags = await getServerFeatureFlags(distinctId, options);
  return flags.moduleFlags;
}
