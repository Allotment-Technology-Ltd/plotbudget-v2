'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

  if (showGated) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm" data-testid="signup-page">
        <DeletedAccountToast />
        <SignupGatedView waitlistUrl={waitlistUrl} />
      </div>
    );
  }

  if (regionAllowed === false && !allowSignupForPartnerInvite) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm" data-testid="signup-page">
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
    <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm" data-testid="signup-page">
      <DeletedAccountToast />
      <div className="space-y-2">
        <p className="font-heading text-xs uppercase tracking-[0.2em] text-primary">
          Sign up
        </p>
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider text-foreground">
          Create account
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
  );
}
