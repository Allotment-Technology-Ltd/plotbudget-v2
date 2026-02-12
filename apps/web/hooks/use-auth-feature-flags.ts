'use client';

import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  getSignupGatedFromEnv,
  getGoogleLoginEnabledFromEnv,
  getAvatarEnabledFromEnv,
  getWaitlistUrlFromEnv,
  getPricingEnabledFromEnv,
  getDevPaymentsOverrideFromEnv,
} from '@/lib/feature-flags';

/**
 * Auth feature flags: signup gating (beta waitlist), Google login visibility, avatar.
 * Uses PostHog when configured; otherwise falls back to env vars.
 * PostHog flags: "signup-gated", "google-login-enabled", "avatar-enabled", "pricing-enabled".
 *
 * For payment/pricing UI use paymentUiVisible and fullPremiumVisible so dev override
 * (NEXT_PUBLIC_DEV_PAYMENTS) is applied in local development.
 */
export function useAuthFeatureFlags(): {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  avatarEnabled: boolean;
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
  const posthogAvatar = useFeatureFlagEnabled('avatar-enabled');
  const posthogPricingEnabled = useFeatureFlagEnabled('pricing-enabled');

  const envSignupGated = getSignupGatedFromEnv();
  const envGoogleLogin = getGoogleLoginEnabledFromEnv();
  const envAvatar = getAvatarEnabledFromEnv();
  const waitlistUrl = getWaitlistUrlFromEnv();
  const envPricingEnabled = getPricingEnabledFromEnv();

  const signupGated =
    posthog && posthogSignupGated !== undefined ? posthogSignupGated : envSignupGated;
  const googleLoginEnabled =
    posthog && posthogGoogleLogin !== undefined ? posthogGoogleLogin : envGoogleLogin;
  const avatarEnabled =
    posthog && posthogAvatar !== undefined ? posthogAvatar : envAvatar;
  const pricingEnabled =
    posthog && posthogPricingEnabled !== undefined ? posthogPricingEnabled : envPricingEnabled;

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
    avatarEnabled,
    waitlistUrl,
    pricingEnabled,
    paymentUiVisible,
    fullPremiumVisible,
  };
}
