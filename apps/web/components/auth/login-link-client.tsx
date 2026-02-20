'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { checkEmailAllowed } from '@/app/actions/auth';
import { ALLOWLIST_ERROR_MESSAGE } from '@/lib/auth/allowlist';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';
import { setLastLoginMethod } from '@/lib/auth/last-login-method';
import { AuthMinimalHeader } from '@/components/auth/auth-brand-header';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { marketingUrl } from '@/lib/marketing-url';
import { ChevronLeft } from 'lucide-react';

/**
 * Encapsulates magic-link submission: validation, allowlist check, redirect cookie,
 * Supabase signInWithOtp, and last-login persistence.
 */
function useMagicLinkSubmit(redirectTo: string | null) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed) {
        setError('Please enter your email address');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const allowed = await checkEmailAllowed(trimmed);
        if (!allowed) {
          setError(ALLOWLIST_ERROR_MESSAGE);
          return;
        }
        if (redirectTo?.startsWith('/')) {
          setRedirectAfterAuthCookie(redirectTo);
        }
        const supabase = createClient();
        const redirectToUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
        const { error: err } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: { emailRedirectTo: redirectToUrl },
        });
        if (err) {
          setError(err.message);
          return;
        }
        setLastLoginMethod('magic_link');
        setSent(true);
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, redirectTo]
  );

  return { email, setEmail, handleSubmit, loading, error, sent };
}

/**
 * Dedicated "Email me a sign-in link" screen: single email field.
 * Back link to /login. Success state on same page.
 */
export function LoginLinkClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';

  const { email, setEmail, handleSubmit, loading, error, sent } =
    useMagicLinkSubmit(redirectTo);

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
        {sent ? (
          <>
            <p className="text-muted-foreground font-body text-sm" data-testid="magic-link-sent">
              We sent a sign-in link to <strong className="text-foreground">{email}</strong>. Click
              the link to continue.
            </p>
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/login${redirectQuery}`}
                className="text-primary hover:underline"
              >
                Use a different sign-in method
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground font-body text-sm mb-4">
              We&apos;ll send a link to your email. No password needed.
            </p>
            <form
              onSubmit={handleSubmit}
              className="space-y-3.5"
              noValidate
              aria-label="Email sign-in link"
            >
              <div className="space-y-1.5">
                <Label htmlFor="magic-link-email">Email</Label>
                <Input
                  id="magic-link-email"
                  type="email"
                  placeholder="you@example.com"
                  className="normal-case h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  data-testid="magic-link-email"
                  autoComplete="email"
                  aria-invalid={!!error}
                />
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                aria-busy={loading}
                data-testid="magic-link-submit"
              >
                {loading ? 'Sending...' : 'Send sign-in link'}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground pt-2">
              Don&apos;t have an account?{' '}
              <Link
                href={`/signup${redirectQuery}`}
                className="text-primary hover:underline font-medium"
                data-testid="nav-signup"
              >
                Sign up
              </Link>
              {' or '}
              <Link
                href={marketingUrl('/')}
                className="text-primary hover:underline font-medium"
                data-testid="nav-learn-more"
                target="_blank"
                rel="noopener noreferrer"
              >
                learn more
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
