'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';

export function LoginPageClient() {
  const { signupGated, googleLoginEnabled } = useAuthFeatureFlags();

  const showBetaMessage = signupGated;
  const showForgotPassword = !signupGated;
  const showGoogleLogin = googleLoginEnabled;

  return (
    <div className="bg-card rounded-lg p-8 space-y-6">
      <DeletedAccountToast />
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Welcome Back
        </h1>
        <p className="text-muted-foreground font-body">
          {showBetaMessage
            ? 'PLOT is in private beta. Sign in to your account below.'
            : 'Sign in to your PLOT account'}
        </p>
      </div>

      <AuthForm
        mode="login"
        showForgotPassword={showForgotPassword}
        showGoogleLogin={showGoogleLogin}
      />
    </div>
  );
}
