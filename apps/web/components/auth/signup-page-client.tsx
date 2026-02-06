'use client';

import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { SignupGatedView } from '@/components/auth/signup-gated-view';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';

/** True when redirect points back to partner join (invite flow). */
function isPartnerInviteRedirect(redirect: string | null): boolean {
  if (!redirect) return false;
  try {
    const path = redirect.startsWith('/') ? redirect : new URL(redirect).pathname;
    return path.includes('/partner/join');
  } catch {
    return redirect.includes('/partner/join');
  }
}

export function SignupPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { signupGated, waitlistUrl } = useAuthFeatureFlags();

  const allowSignupForPartnerInvite = isPartnerInviteRedirect(redirectTo);
  const showGated = signupGated && !allowSignupForPartnerInvite;

  if (showGated) {
    return (
      <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
        <DeletedAccountToast />
        <SignupGatedView waitlistUrl={waitlistUrl} />
      </div>
    );
  }

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
