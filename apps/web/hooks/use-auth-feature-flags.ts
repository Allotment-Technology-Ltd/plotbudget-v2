'use client';

import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  getSignupGatedFromEnv,
  getGoogleLoginEnabledFromEnv,
  getAvatarEnabledFromEnv,
  getWaitlistUrlFromEnv,
  getPricingEnabledFromEnv,
} from '@/lib/feature-flags';

/**
 * Auth feature flags: signup gating (beta waitlist), Google login visibility, avatar, pricing.
 * Uses PostHog when configured; otherwise falls back to env vars.
 * PostHog flags: "signup-gated", "google-login-enabled", "avatar-enabled", "pricing-enabled".
 */
export function useAuthFeatureFlags(): {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  avatarEnabled: boolean;
  waitlistUrl: string;
  pricingEnabled: boolean;
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

  return { signupGated, googleLoginEnabled, avatarEnabled, waitlistUrl, pricingEnabled };
}
