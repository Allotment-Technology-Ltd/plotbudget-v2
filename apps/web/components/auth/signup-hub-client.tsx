'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthCardBrand, AuthMinimalHeader } from '@/components/auth/auth-brand-header';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { SignupGatedView } from '@/components/auth/signup-gated-view';
import { RegionRestrictedView } from '@/components/auth/region-restricted-view';
import { SignupTerms } from '@/components/auth/signup-terms';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { getSignupRegionAllowed } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

/** True when redirect points to partner complete/join (invite flow). */
function isPartnerInviteRedirect(redirect: string | null): boolean {
  if (!redirect) return false;
  try {
    const path = redirect.startsWith('/') ? redirect : new URL(redirect).pathname;
    return path.includes('/partner/join') || path.includes('/partner/complete');
  } catch {
    return redirect.includes('/partner/join') || redirect.includes('/partner/complete');
  }
}

/**
 * Linear-style signup hub: one card with choices only.
 * Google first (prominent), then Apple, then "Sign up with email" → /signup/email.
 * When gated or region-restricted, show SignupGatedView or RegionRestrictedView.
 */
export function SignupHubClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { signupGated, waitlistUrl, googleLoginEnabled, appleLoginEnabled } =
    useAuthFeatureFlags();
  const [regionAllowed, setRegionAllowed] = useState<boolean | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const allowSignupForPartnerInvite = isPartnerInviteRedirect(redirectTo);
  const showGated = signupGated && !allowSignupForPartnerInvite;
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
  const emailUrl = `/signup/email${redirectQuery}`;

  useEffect(() => {
    getSignupRegionAllowed().then(({ allowed }) => setRegionAllowed(allowed));
  }, []);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (oauthLoading) return;
    setOauthLoading(provider);
    try {
      if (redirectTo?.startsWith('/')) {
        setRedirectAfterAuthCookie(redirectTo);
      }
      const supabase = createClient();
      const redirectToUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectToUrl },
      });
      if (error) {
        setOauthLoading(null);
        throw error;
      }
    } catch {
      setOauthLoading(null);
    }
  };

  if (showGated) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-sm" data-testid="signup-page">
        <DeletedAccountToast />
        <AuthCardBrand tagline="The 20-minute payday ritual" />
        <div className="border-t border-border/50 pt-5 mt-5">
          <SignupGatedView waitlistUrl={waitlistUrl} />
        </div>
      </div>
    );
  }

  if (regionAllowed === false && !allowSignupForPartnerInvite) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-sm" data-testid="signup-page">
        <DeletedAccountToast />
        <AuthCardBrand tagline="The 20-minute payday ritual" />
        <div className="border-t border-border/50 pt-5 mt-5">
          <RegionRestrictedView />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center w-full" data-testid="signup-page">
      <DeletedAccountToast />
      <AuthMinimalHeader title="Sign up to PLOT" />
      <div className="w-full mt-8 space-y-4">
        <div className="flex flex-col gap-2">
          {googleLoginEnabled && (
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center uppercase"
              disabled={!!oauthLoading}
              aria-busy={oauthLoading === 'google'}
              data-testid="oauth-google"
              onClick={() => handleOAuth('google')}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                />
              </svg>
              {oauthLoading === 'google' ? 'Loading...' : 'Continue with Google'}
            </Button>
          )}
          {appleLoginEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center uppercase"
              disabled={!!oauthLoading}
              aria-busy={oauthLoading === 'apple'}
              data-testid="oauth-apple"
              onClick={() => handleOAuth('apple')}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 6.98.48 10.21zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25 2.08-.18 3.86 1.5 3.97 3.65-.03 2.2-1.7 4.04-3.76 4.21-2.06.17-3.92-1.44-3.94-3.61z"
                  fill="currentColor"
                />
              </svg>
              {oauthLoading === 'apple' ? 'Loading...' : 'Continue with Apple'}
            </Button>
          )}
          <Link href={emailUrl}>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center uppercase"
              data-testid="signup-with-email"
            >
              <Mail className="mr-2 h-4 w-4" aria-hidden />
              Continue with email
            </Button>
          </Link>
        </div>

        <SignupTerms />

        <p className="text-sm text-muted-foreground pt-2">
          Already have an account?{' '}
          <Link
            href={`/login${redirectQuery}`}
            className="text-primary hover:underline font-medium"
            data-testid="nav-login"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
