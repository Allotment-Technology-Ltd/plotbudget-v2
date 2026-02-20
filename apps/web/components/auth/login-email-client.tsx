'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthMinimalHeader } from '@/components/auth/auth-brand-header';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { ChevronLeft } from 'lucide-react';

/**
 * Linear-style: logo + "Log in to PLOT", then email/password form.
 */
export function LoginEmailClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const authError = searchParams.get('error');
  const { signupGated } = useAuthFeatureFlags();
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';

  return (
    <div className="flex flex-col items-center text-center w-full">
      <DeletedAccountToast />
      <Link
        href={`/login${redirectQuery}`}
        className="self-start inline-flex items-center text-sm text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded mb-4"
        data-testid="back-to-login"
      >
        <ChevronLeft className="h-4 w-4 mr-0.5" aria-hidden />
        Back
      </Link>
      <AuthMinimalHeader title="Log in to PLOT" />
      <div className="w-full mt-8 space-y-4 text-left">
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
        <AuthForm
          mode="login"
          showForgotPassword={!signupGated}
          showGoogleLogin={false}
          showAppleLogin={false}
          showMagicLink={false}
          hideAlternateMethods
          redirectTo={redirectTo ?? undefined}
        />
      </div>
    </div>
  );
}
