'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthCardBrand } from '@/components/auth/auth-brand-header';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { SignupGatedView } from '@/components/auth/signup-gated-view';
import { RegionRestrictedView } from '@/components/auth/region-restricted-view';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { getSignupRegionAllowed } from '@/app/actions/auth';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';

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
  const { signupGated, waitlistUrl, googleLoginEnabled, appleLoginEnabled } =
    useAuthFeatureFlags();
  const [regionAllowed, setRegionAllowed] = useState<boolean | null>(null);

  const allowSignupForPartnerInvite = isPartnerInviteRedirect(redirectTo);
  const showGated = signupGated && !allowSignupForPartnerInvite;

  useEffect(() => {
    getSignupRegionAllowed().then(({ allowed }) => setRegionAllowed(allowed));
  }, []);

  // After email confirmation Supabase sends user to auth/callback; store where to send them next
  useEffect(() => {
    if (redirectTo?.startsWith('/')) {
      setRedirectAfterAuthCookie(redirectTo);
    }
  }, [redirectTo]);

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
    <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-sm" data-testid="signup-page">
      <DeletedAccountToast />
      <AuthCardBrand tagline="The 20-minute payday ritual" />
      <div className="border-t border-border/50 pt-5 mt-5 space-y-4">
        <div className="space-y-0.5">
          <h1 className="font-heading text-lg font-semibold uppercase tracking-wider text-foreground">
            Create your account
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Start plotting your budget together — no bank access needed.
          </p>
        </div>
        <AuthForm
          mode="signup"
          showGoogleLogin={googleLoginEnabled}
          showAppleLogin={appleLoginEnabled}
          redirectTo={redirectTo ?? undefined}
        />
      </div>
    </div>
  );
}
