// apps/web/components/auth/auth-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { checkEmailAllowed } from '@/app/actions/auth';
import { ALLOWLIST_ERROR_MESSAGE } from '@/lib/auth/allowlist';
import { setRedirectAfterAuthCookie } from '@/lib/auth/redirect-after-auth';
import { setLastLoginMethod } from '@/lib/auth/last-login-method';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { marketingUrl } from '@/lib/marketing-url';

// Login schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Signup schema
const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Password can only contain letters, numbers, hyphens, and underscores'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
  /** When false, hide "Forgot password?" link (e.g. in beta gated mode). Default true. */
  showForgotPassword?: boolean;
  /** When false, hide Google login option. Default true for signup, false until flag enabled. */
  showGoogleLogin?: boolean;
  /** When true, show "Continue with Apple". */
  showAppleLogin?: boolean;
  /** When true, show "Email me a sign-in link" (magic link) on login. */
  showMagicLink?: boolean;
  /** When true, hide OAuth and magic link in footer (e.g. on dedicated /login/email page). */
  hideAlternateMethods?: boolean;
  /** After success, redirect here instead of /dashboard (e.g. partner join URL). */
  redirectTo?: string;
}

export function AuthForm({
  mode,
  showForgotPassword = true,
  showGoogleLogin = false,
  showAppleLogin = false,
  showMagicLink = false,
  hideAlternateMethods = false,
  redirectTo,
}: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isLogin = mode === 'login';

  if (isLogin) {
    return (
      <LoginForm
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        router={router}
        showForgotPassword={showForgotPassword}
        showGoogleLogin={showGoogleLogin}
        showAppleLogin={showAppleLogin}
        showMagicLink={showMagicLink}
        hideAlternateMethods={hideAlternateMethods}
        redirectTo={redirectTo}
      />
    );
  }

  return (
    <SignupForm
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      router={router}
      showGoogleLogin={showGoogleLogin}
      showAppleLogin={showAppleLogin}
      hideAlternateMethods={hideAlternateMethods}
      redirectTo={redirectTo}
    />
  );
}


// Login Form Component
function LoginForm({
  isLoading,
  setIsLoading,
  router,
  showForgotPassword = true,
  showGoogleLogin = false,
  showAppleLogin = false,
  showMagicLink = false,
  hideAlternateMethods = false,
  redirectTo,
}: {
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
  showForgotPassword?: boolean;
  showGoogleLogin?: boolean;
  showAppleLogin?: boolean;
  showMagicLink?: boolean;
  hideAlternateMethods?: boolean;
  redirectTo?: string;
}) {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          form.setError('root', {
            message: 'Email or password is incorrect',
          });
        } else {
          form.setError('root', { message: error.message });
        }
        return;
      }

      setLastLoginMethod('email');
      router.push(redirectTo ?? '/dashboard');
      try {
        toast.success('Welcome back!');
      } catch {
        // Don't block redirect if toast fails (e.g. in test env)
      }
    } catch (error) {
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForm = () => form.handleSubmit(onSubmit)();
  const onEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitForm();
    }
  };

  return (
    <div className="space-y-5">
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitForm();
        }}
        className="space-y-3.5"
        noValidate
        aria-label="Sign in"
      >
        {/* Email field */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="normal-case h-10"
            data-testid="email-input"
            {...form.register('email')}
            onKeyDown={onEnterSubmit}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
          />
          {form.formState.errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            {showForgotPassword && (
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:underline shrink-0"
                data-testid="nav-reset-password"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="normal-case h-10"
            data-testid="password-input"
            {...form.register('password')}
            onKeyDown={onEnterSubmit}
            aria-invalid={!!form.formState.errors.password}
            aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
          />
          {form.formState.errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Root error */}
        {form.formState.errors.root && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3"
            role="alert"
            aria-live="polite"
            data-testid="login-error-message"
          >
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
          data-testid="submit-login-form"
        >
          {isLoading ? 'Loading...' : 'Sign In'}
        </Button>
      </form>

      <AuthFooter
        isLogin={true}
        showGoogleLogin={showGoogleLogin}
        showAppleLogin={showAppleLogin}
        showMagicLink={showMagicLink}
        hideAlternateMethods={hideAlternateMethods}
        redirectTo={redirectTo}
      />
    </div>
  );
}

// Signup Form Component
function SignupForm({
  isLoading,
  setIsLoading,
  router,
  showGoogleLogin = false,
  showAppleLogin = false,
  hideAlternateMethods = false,
  redirectTo,
}: {
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
  showGoogleLogin?: boolean;
  showAppleLogin?: boolean;
  hideAlternateMethods?: boolean;
  redirectTo?: string;
}) {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const allowed = await checkEmailAllowed(data.email);
      if (!allowed) {
        form.setError('email', {
          message: ALLOWLIST_ERROR_MESSAGE,
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          form.setError('email', {
            message: 'An account with this email already exists',
          });
        } else {
          form.setError('root', { message: error.message });
        }
        return;
      }

      router.push(redirectTo ?? '/dashboard');
      try {
        toast.success('Account created successfully!');
      } catch {
        // Don't block redirect if toast fails (e.g. in test env)
      }
    } catch (error) {
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitForm = () => form.handleSubmit(onSubmit)();
  const onEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitForm();
    }
  };

  return (
    <div className="space-y-6">
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitForm();
        }}
        className="space-y-4"
        noValidate
        aria-label="Create account"
        data-testid="signup-form"
      >
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="normal-case"
            {...form.register('email')}
            onKeyDown={onEnterSubmit}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
          />
          {form.formState.errors.email && (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="e.g. coffee-piano-sunset"
            className="normal-case"
            {...form.register('password')}
            onKeyDown={onEnterSubmit}
            aria-invalid={!!form.formState.errors.password}
            aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
          />
          {form.formState.errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            className="normal-case"
            {...form.register('confirmPassword')}
            onKeyDown={onEnterSubmit}
            aria-invalid={!!form.formState.errors.confirmPassword}
            aria-describedby={
              form.formState.errors.confirmPassword ? 'confirm-password-error' : undefined
            }
          />
          {form.formState.errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Root error */}
        {form.formState.errors.root && (
          <div
            className="rounded-md bg-destructive/10 border border-destructive/30 p-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
          data-testid="submit-signup-form"
        >
          {isLoading ? 'Loading...' : 'Create Account'}
        </Button>
      </form>

      <AuthFooter
        isLogin={false}
        showGoogleLogin={showGoogleLogin}
        showAppleLogin={showAppleLogin}
        hideAlternateMethods={hideAlternateMethods}
        redirectTo={redirectTo}
      />
    </div>
  );
}

// Shared Footer Component
function AuthFooter({
  isLogin,
  showGoogleLogin = false,
  showAppleLogin = false,
  showMagicLink = false,
  hideAlternateMethods = false,
  redirectTo,
}: {
  isLogin: boolean;
  showGoogleLogin?: boolean;
  showAppleLogin?: boolean;
  showMagicLink?: boolean;
  /** When true, only show sign up / sign in link; no OAuth or magic link. */
  hideAlternateMethods?: boolean;
  redirectTo?: string;
}) {
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const redirectQuery = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
  const showOAuth = !hideAlternateMethods && (showGoogleLogin || showAppleLogin);
  const showMagicLinkBlock = isLogin && !hideAlternateMethods && showMagicLink;

  const handleOAuth = async (provider: 'google' | 'apple') => {
    if (oauthLoading) return;
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
      if (error) {
        setOauthLoading(null);
        throw error;
      }
      // Supabase redirects away; no need to clear loading
    } catch {
      setOauthLoading(null);
      // Error will surface after redirect or can be shown via toast if we don't redirect
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = magicLinkEmail.trim();
    if (!email) {
      setMagicLinkError('Please enter your email address');
      return;
    }
    setMagicLinkError(null);
    setMagicLinkLoading(true);
    try {
      const allowed = await checkEmailAllowed(email);
      if (!allowed) {
        setMagicLinkError(ALLOWLIST_ERROR_MESSAGE);
        return;
      }
      if (redirectTo?.startsWith('/')) {
        setRedirectAfterAuthCookie(redirectTo);
      }
      const supabase = createClient();
      const redirectToUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectToUrl },
      });
      if (error) {
        setMagicLinkError(error.message);
        return;
      }
      setMagicLinkSent(true);
    } catch {
      setMagicLinkError('Something went wrong. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  return (
    <>
      {showOAuth && (
        <>
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {showGoogleLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!!oauthLoading}
              aria-busy={oauthLoading === 'google'}
              data-testid="oauth-google"
              onClick={() => handleOAuth('google')}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {oauthLoading === 'google' ? 'Loading...' : 'Continue with Google'}
            </Button>
          )}

          {showAppleLogin && (
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              disabled={!!oauthLoading}
              aria-busy={oauthLoading === 'apple'}
              data-testid="oauth-apple"
              onClick={() => handleOAuth('apple')}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 6.98.48 10.21zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25 2.08-.18 3.86 1.5 3.97 3.65-.03 2.2-1.7 4.04-3.76 4.21-2.06.17-3.92-1.44-3.94-3.61z"
                  fill="currentColor"
                />
              </svg>
              {oauthLoading === 'apple' ? 'Loading...' : 'Continue with Apple'}
            </Button>
          )}
        </>
      )}

      {showMagicLinkBlock && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          {magicLinkSent ? (
            <p className="text-sm text-center text-muted-foreground" data-testid="magic-link-sent">
              Check your email for a sign-in link. Click the link to continue.
            </p>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-2" aria-label="Email sign-in link">
              <Input
                type="email"
                placeholder="you@example.com"
                className="normal-case"
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                disabled={magicLinkLoading}
                data-testid="magic-link-email"
                aria-label="Email for sign-in link"
              />
              {magicLinkError && (
                <p className="text-sm text-destructive" role="alert">
                  {magicLinkError}
                </p>
              )}
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={magicLinkLoading}
                aria-busy={magicLinkLoading}
                data-testid="magic-link-submit"
              >
                {magicLinkLoading ? 'Sending...' : 'Email me a sign-in link'}
              </Button>
            </form>
          )}
        </>
      )}

      {/* Switch mode link */}
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        {isLogin ? (
          <>
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
          </>
        ) : (
          <Link
            href={`/login${redirectQuery}`}
            className="text-primary hover:underline font-medium"
            data-testid="nav-login"
          >
            Log in
          </Link>
        )}
      </p>
    </>
  );
}