'use client';

import { useSearchParams } from 'next/navigation';
import { AuthCardBrand } from '@/components/auth/auth-brand-header';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const authError = searchParams.get('error');
  const { signupGated, googleLoginEnabled, appleLoginEnabled, magicLinkEnabled } =
    useAuthFeatureFlags();

  const showBetaMessage = signupGated;
  const showForgotPassword = !signupGated;
  const showGoogleLogin = googleLoginEnabled;
  const showAppleLogin = appleLoginEnabled;
  const showMagicLink = magicLinkEnabled;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-sm">
      <DeletedAccountToast />
      <AuthCardBrand tagline="The 20-minute payday ritual" />
      <div className="border-t border-border/50 pt-5 mt-5 space-y-4">
        {authError === 'auth_failed' && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
            role="alert"
            data-testid="auth-callback-error"
          >
            Sign-in was cancelled or failed. Please try again.
          </div>
        )}
        {authError === 'allowlist' && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
            role="alert"
            data-testid="auth-allowlist-error"
          >
            This email is not on the invite list. Please contact support for access.
          </div>
        )}
        <div className="space-y-0.5">
          <h1 className="font-heading text-lg font-semibold uppercase tracking-wider text-foreground">
            Sign in to your account
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            {showBetaMessage
              ? 'PLOT is in private beta. Sign in below.'
              : 'Your budget awaits.'}
          </p>
        </div>

        <AuthForm
          mode="login"
          showForgotPassword={showForgotPassword}
          showGoogleLogin={showGoogleLogin}
          showAppleLogin={showAppleLogin}
          showMagicLink={showMagicLink}
          redirectTo={redirectTo ?? undefined}
        />
      </div>
    </div>
  );
}
