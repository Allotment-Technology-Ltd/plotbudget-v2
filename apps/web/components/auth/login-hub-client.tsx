'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthMinimalHeader } from '@/components/auth/auth-brand-header';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { createClient } from '@/lib/supabase/client';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';
import {
  getLastLoginMethod,
  setLastLoginMethod,
  getLastLoginMethodLabel,
  type LastLoginMethod,
} from '@/lib/auth/last-login-method';
import { Button } from '@/components/ui/button';
import { marketingUrl } from '@/lib/marketing-url';
import { Mail, Link2 } from 'lucide-react';

const DEFAULT_ORDER: LastLoginMethod[] = ['google', 'apple', 'email', 'magic_link'];

/**
 * OAuth sign-in flow and loading state for login hub.
 */
function useLoginOAuth(redirectTo: string | null) {
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleOAuth = useCallback(
    async (provider: 'google' | 'apple') => {
      if (oauthLoading) return;
      setLastLoginMethod(provider);
      setOauthLoading(provider);
      try {
        if (redirectTo?.startsWith('/')) {
          setRedirectAfterAuthCookie(redirectTo);
        }
        const supabase = createClient();
        const redirectToUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: redirectToUrl },
        });
        if (error) throw error;
      } finally {
        setOauthLoading(null);
      }
    },
    [oauthLoading, redirectTo]
  );

  return { handleOAuth, oauthLoading };
}

/**
 * Last-used login method (from storage) and ordered list of methods for the hub.
 * lastUsed is only read after mount to avoid hydration mismatch (server has no localStorage).
 */
function useOrderedLoginMethods(
  googleLoginEnabled: boolean,
  appleLoginEnabled: boolean,
  magicLinkEnabled: boolean
) {
  const [lastUsed, setLastUsed] = useState<LastLoginMethod | null>(null);

  useEffect(() => {
    setLastUsed(getLastLoginMethod());
  }, []);

  const orderedMethods = useMemo(() => {
    const enabled = new Set<LastLoginMethod>();
    if (googleLoginEnabled) enabled.add('google');
    enabled.add('email');
    if (magicLinkEnabled) enabled.add('magic_link');
    if (appleLoginEnabled) enabled.add('apple');
    const defaultOrder = DEFAULT_ORDER.filter((m) => enabled.has(m));
    if (!lastUsed || !enabled.has(lastUsed)) return defaultOrder;
    return [lastUsed, ...defaultOrder.filter((m) => m !== lastUsed)];
  }, [lastUsed, googleLoginEnabled, appleLoginEnabled, magicLinkEnabled]);

  return { orderedMethods, lastUsed };
}

interface LoginHubButtonsProps {
  orderedMethods: LastLoginMethod[];
  handleOAuth: (provider: 'google' | 'apple') => void;
  oauthLoading: 'google' | 'apple' | null;
  emailUrl: string;
  linkUrl: string;
  googleLoginEnabled: boolean;
  appleLoginEnabled: boolean;
  magicLinkEnabled: boolean;
}

function LoginHubButtons({
  orderedMethods,
  handleOAuth,
  oauthLoading,
  emailUrl,
  linkUrl,
  googleLoginEnabled,
  appleLoginEnabled,
  magicLinkEnabled,
}: LoginHubButtonsProps) {
  const buttons: React.ReactNode[] = [];
  orderedMethods.forEach((method, index) => {
    const isFirst = index === 0;
    if (method === 'google' && googleLoginEnabled) {
      buttons.push(
        <Button
          key="google"
          type="button"
          variant={isFirst ? 'primary' : 'outline'}
          className="w-full justify-center uppercase"
          disabled={!!oauthLoading}
          aria-busy={oauthLoading === 'google'}
          data-testid="oauth-google"
          onClick={() => handleOAuth('google')}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" />
          </svg>
          {oauthLoading === 'google' ? 'Loading...' : 'Continue with Google'}
        </Button>
      );
    } else if (method === 'email') {
      buttons.push(
        <Link key="email" href={emailUrl}>
          <Button
            type="button"
            variant={isFirst ? 'primary' : 'outline'}
            className="w-full justify-center uppercase"
            data-testid="login-with-email"
          >
            <Mail className="mr-2 h-4 w-4" aria-hidden />
            Continue with email
          </Button>
        </Link>
      );
    } else if (method === 'magic_link' && magicLinkEnabled) {
      buttons.push(
        <Link key="magic_link" href={linkUrl}>
          <Button
            type="button"
            variant={isFirst ? 'primary' : 'outline'}
            className="w-full justify-center uppercase"
            data-testid="login-with-link"
          >
            <Link2 className="mr-2 h-4 w-4" aria-hidden />
            Email me a sign-in link
          </Button>
        </Link>
      );
    } else if (method === 'apple' && appleLoginEnabled) {
      buttons.push(
        <Button
          key="apple"
          type="button"
          variant={isFirst ? 'primary' : 'outline'}
          className="w-full justify-center uppercase"
          disabled={!!oauthLoading}
          aria-busy={oauthLoading === 'apple'}
          data-testid="oauth-apple"
          onClick={() => handleOAuth('apple')}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 6.98.48 10.21zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25 2.08-.18 3.86 1.5 3.97 3.65-.03 2.2-1.7 4.04-3.76 4.21-2.06.17-3.92-1.44-3.94-3.61z" fill="currentColor" />
          </svg>
          {oauthLoading === 'apple' ? 'Loading...' : 'Continue with Apple'}
        </Button>
      );
    }
  });

  return <div className="flex flex-col gap-2">{buttons}</div>;
}

/**
 * Linear-style login hub: centred logo + "Log in to PLOT" + option buttons.
 * Puts the last-used login method first and highlights it with primary + "You used X to log in last time".
 */
export function LoginHubClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const authError = searchParams.get('error');
  const { googleLoginEnabled, appleLoginEnabled, magicLinkEnabled } =
    useAuthFeatureFlags();

  const { handleOAuth, oauthLoading } = useLoginOAuth(redirectTo);
  const { orderedMethods, lastUsed } = useOrderedLoginMethods(
    googleLoginEnabled,
    appleLoginEnabled,
    magicLinkEnabled
  );

  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
  const emailUrl = `/login/email${redirectQuery}`;
  const linkUrl = `/login/link${redirectQuery}`;

  return (
    <div className="flex flex-col items-center text-center w-full">
      <DeletedAccountToast />
      <AuthMinimalHeader title="Log in to PLOT" />
      <div className="w-full mt-8 space-y-4">
        {authError === 'auth_failed' && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive text-left"
            role="alert"
            data-testid="auth-callback-error"
          >
            Sign-in was cancelled or failed. Please try again.
          </div>
        )}
        {authError === 'allowlist' && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive text-left"
            role="alert"
            data-testid="auth-allowlist-error"
          >
            This email is not on the invite list. Please contact support for access.
          </div>
        )}

        <LoginHubButtons
          orderedMethods={orderedMethods}
          handleOAuth={handleOAuth}
          oauthLoading={oauthLoading}
          emailUrl={emailUrl}
          linkUrl={linkUrl}
          googleLoginEnabled={googleLoginEnabled}
          appleLoginEnabled={appleLoginEnabled}
          magicLinkEnabled={magicLinkEnabled}
        />
        {lastUsed && orderedMethods[0] === lastUsed && (
          <p className="text-xs text-muted-foreground text-center" data-testid="last-login-message">
            You used {getLastLoginMethodLabel(lastUsed)} to log in last time.
          </p>
        )}

        <p className="text-sm text-muted-foreground pt-4">
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
      </div>
    </div>
  );
}
