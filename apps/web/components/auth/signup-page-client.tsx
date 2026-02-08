'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { SignupGatedView } from '@/components/auth/signup-gated-view';
import { RegionRestrictedView } from '@/components/auth/region-restricted-view';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { getSignupRegionAllowed } from '@/app/actions/auth';

const REDIRECT_AFTER_AUTH_COOKIE = 'redirect_after_auth';
const COOKIE_MAX_AGE = 60 * 10; // 10 minutes

function setRedirectAfterAuthCookie(redirectPath: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${REDIRECT_AFTER_AUTH_COOKIE}=${encodeURIComponent(redirectPath)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

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

export function SignupPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { signupGated, waitlistUrl } = useAuthFeatureFlags();
  const [regionAllowed, setRegionAllowed] = useState<boolean | null>(null);

  const allowSignupForPartnerInvite = isPartnerInviteRedirect(redirectTo);
  const showGated = signupGated && !allowSignupForPartnerInvite;

  useEffect(() => {
    getSignupRegionAllowed().then(({ allowed }) => setRegionAllowed(allowed));
  }, []);

  if (showGated) {
    return (
      <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
        <DeletedAccountToast />
        <SignupGatedView waitlistUrl={waitlistUrl} />
      </div>
    );
  }

  if (regionAllowed === false && !allowSignupForPartnerInvite) {
    return (
      <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
        <DeletedAccountToast />
        <RegionRestrictedView />
      </div>
    );
  }

  // After email confirmation Supabase sends user to auth/callback; store where to send them next
  useEffect(() => {
    if (redirectTo?.startsWith('/')) {
      setRedirectAfterAuthCookie(redirectTo);
    }
  }, [redirectTo]);

  return (
    <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
      <DeletedAccountToast />
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Create Account
        </h1>
        <p className="text-muted-foreground font-body">
          Sign up to start plotting your budget together
        </p>
      </div>
      <AuthForm mode="signup" redirectTo={redirectTo ?? undefined} />
    </div>
  );
}
