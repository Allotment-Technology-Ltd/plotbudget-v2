'use client';

import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  getSignupGatedFromEnv,
  getGoogleLoginEnabledFromEnv,
  getAppleLoginEnabledFromEnv,
  getMagicLinkEnabledFromEnv,
  getWaitlistUrlFromEnv,
  getPricingEnabledFromEnv,
  getDevPaymentsOverrideFromEnv,
  isPreProdContext,
} from '@/lib/feature-flags';

/**
 * Auth feature flags: signup gating (beta waitlist), Google/Apple/magic-link visibility, avatar, pricing.
 * Uses PostHog when configured; otherwise falls back to env vars.
 * In pre-prod (local, Vercel preview, or APP_ENV=preview|staging) PostHog is bypassed and env vars are used.
 * PostHog flags: "signup-gated", "google-login-enabled", "apple-login-enabled", "magic-link-enabled", "pricing-enabled".
 *
 * For payment/pricing UI use paymentUiVisible and fullPremiumVisible so dev override
 * (NEXT_PUBLIC_DEV_PAYMENTS) is applied in local development.
 */
export function useAuthFeatureFlags(): {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  appleLoginEnabled: boolean;
  magicLinkEnabled: boolean;
  waitlistUrl: string;
  pricingEnabled: boolean;
  /** Show pricing page, pricing link, Subscription tab (state 2 or 3). Use for nav/settings. */
  paymentUiVisible: boolean;
  /** Show full premium pricing (state 3). Use for pricing page content. */
  fullPremiumVisible: boolean;
} {
  const posthog = usePostHog();
  const posthogSignupGated = useFeatureFlagEnabled('signup-gated');
  const posthogGoogleLogin = useFeatureFlagEnabled('google-login-enabled');
  const posthogAppleLogin = useFeatureFlagEnabled('apple-login-enabled');
  const posthogMagicLink = useFeatureFlagEnabled('magic-link-enabled');
  const posthogPricingEnabled = useFeatureFlagEnabled('pricing-enabled');

  const envSignupGated = getSignupGatedFromEnv();
  const envGoogleLogin = getGoogleLoginEnabledFromEnv();
  const envAppleLogin = getAppleLoginEnabledFromEnv();
  const envMagicLink = getMagicLinkEnabledFromEnv();
  const waitlistUrl = getWaitlistUrlFromEnv();
  const envPricingEnabled = getPricingEnabledFromEnv();

  const useEnvForAuthFlags = isPreProdContext();

  const signupGated = useEnvForAuthFlags
    ? envSignupGated
    : posthog && posthogSignupGated !== undefined
      ? posthogSignupGated
      : envSignupGated;
  const googleLoginEnabled = useEnvForAuthFlags
    ? envGoogleLogin
    : posthog && posthogGoogleLogin !== undefined
      ? posthogGoogleLogin
      : envGoogleLogin;
  const appleLoginEnabled = useEnvForAuthFlags
    ? envAppleLogin
    : posthog && posthogAppleLogin !== undefined
      ? posthogAppleLogin
      : envAppleLogin;
  const magicLinkEnabled = useEnvForAuthFlags
    ? envMagicLink
    : posthog && posthogMagicLink !== undefined
      ? posthogMagicLink
      : envMagicLink;
  const pricingEnabled = useEnvForAuthFlags
    ? envPricingEnabled
    : posthog && posthogPricingEnabled !== undefined
      ? posthogPricingEnabled
      : envPricingEnabled;

  const devOverride = getDevPaymentsOverrideFromEnv();
  const paymentUiVisible =
    devOverride === 'off'
      ? false
      : devOverride === 'pwyl' || devOverride === 'full'
        ? true
        : !signupGated;
  const fullPremiumVisible =
    devOverride === 'full'
      ? true
      : devOverride === 'off' || devOverride === 'pwyl'
        ? false
        : pricingEnabled;

  return {
    signupGated,
    googleLoginEnabled,
    appleLoginEnabled,
    magicLinkEnabled,
    waitlistUrl,
    pricingEnabled,
    paymentUiVisible,
    fullPremiumVisible,
  };
}