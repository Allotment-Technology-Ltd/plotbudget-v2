'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthMinimalHeader } from '@/components/auth/auth-brand-header';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { SignupTerms } from '@/components/auth/signup-terms';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';
import { ChevronLeft } from 'lucide-react';

/**
 * Linear-style: logo + "Sign up to PLOT", then email/password form + terms.
 */
export function SignupEmailClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';

  useEffect(() => {
    if (redirectTo?.startsWith('/')) {
      setRedirectAfterAuthCookie(redirectTo);
    }
  }, [redirectTo]);

  return (
    <div className="flex flex-col items-center text-center w-full" data-testid="signup-page">
      <DeletedAccountToast />
      <Link
        href={`/signup${redirectQuery}`}
        className="self-start inline-flex items-center text-sm text-muted-foreground hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded mb-4"
        data-testid="back-to-signup"
      >
        <ChevronLeft className="h-4 w-4 mr-0.5" aria-hidden />
        Back
      </Link>
      <AuthMinimalHeader title="Sign up to PLOT" />
      <div className="w-full mt-8 space-y-4 text-left">
        <AuthForm
          mode="signup"
          showGoogleLogin={false}
          showAppleLogin={false}
          hideAlternateMethods
          redirectTo={redirectTo ?? undefined}
        />
        <SignupTerms />
      </div>
    </div>
  );
}
