'use client';

import { useSearchParams } from 'next/navigation';
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
    <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm">
      <DeletedAccountToast />
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
      <div className="space-y-2">
        <p className="font-heading text-xs uppercase tracking-[0.2em] text-primary">
          Sign in
        </p>
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider text-foreground">
          Welcome back
        </h1>
        <p className="text-muted-foreground font-body text-sm">
          {showBetaMessage
            ? 'PLOT is in private beta. Sign in to your account below.'
            : 'Pick up where you left off — your budget awaits.'}
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
  );
}
