'use client';

import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import {
  getSignupGatedFromEnv,
  getGoogleLoginEnabledFromEnv,
  getWaitlistUrlFromEnv,
} from '@/lib/feature-flags';

/**
 * Auth feature flags: signup gating (beta waitlist) and Google login visibility.
 * Uses PostHog when configured; otherwise falls back to env vars.
 * Create flags in PostHog dashboard: "signup-gated" (boolean), "google-login-enabled" (boolean).
 */
export function useAuthFeatureFlags(): {
  signupGated: boolean;
  googleLoginEnabled: boolean;
  waitlistUrl: string;
} {
  const posthog = usePostHog();
  const posthogSignupGated = useFeatureFlagEnabled('signup-gated');
  const posthogGoogleLogin = useFeatureFlagEnabled('google-login-enabled');

  const envSignupGated = getSignupGatedFromEnv();
  const envGoogleLogin = getGoogleLoginEnabledFromEnv();
  const waitlistUrl = getWaitlistUrlFromEnv();

  const signupGated =
    posthog && posthogSignupGated !== undefined ? posthogSignupGated : envSignupGated;
  const googleLoginEnabled =
    posthog && posthogGoogleLogin !== undefined ? posthogGoogleLogin : envGoogleLogin;

  return { signupGated, googleLoginEnabled, waitlistUrl };
}
