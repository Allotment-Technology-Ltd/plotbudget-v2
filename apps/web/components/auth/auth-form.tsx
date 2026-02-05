'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

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

const FRIENDLY_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email or password is incorrect',
  'User already registered': 'An account with this email already exists',
};

function getFriendlyMessage(message: string): string {
  return FRIENDLY_ERROR_MAP[message] ?? message;
}

export interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const isLogin = mode === 'login';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const form = isLogin ? loginForm : signupForm;
  const onSubmit = isLogin ? handleLogin : handleSignup;

  async function handleLogin(data: LoginFormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const message = getFriendlyMessage(error.message);
      loginForm.setError('root', { message });
      loginForm.setError('password', { message });
      return;
    }

    setRedirecting(true);
    router.push('/auth/callback');
  }

  async function handleSignup(data: SignupFormData) {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const message = getFriendlyMessage(error.message);
      signupForm.setError('root', { message });
      signupForm.setError('email', { message });
      return;
    }

    setRedirecting(true);
    router.push('/auth/callback');
  }

  const isSubmitting = form.formState.isSubmitting || redirecting;
  const rootError = (isLogin ? loginForm : signupForm).formState.errors.root?.message;

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-label={isLogin ? 'Sign in' : 'Create account'}
      >
        {rootError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 font-body text-sm text-destructive"
          >
            {rootError}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...(isLogin ? loginForm.register('email') : signupForm.register('email'))}
        />

        <Input
          label="Password"
          type="password"
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          placeholder={isLogin ? '••••••••' : 'At least 12 characters'}
          error={form.formState.errors.password?.message}
          {...(isLogin ? loginForm.register('password') : signupForm.register('password'))}
        />

        {!isLogin && (
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={form.formState.errors.confirmPassword?.message}
            {...signupForm.register('confirmPassword')}
          />
        )}

        {isLogin && (
          <div className="text-right">
            <Link
              href="/reset-password"
              className="font-body text-sm text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isLogin ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center font-body text-xs text-muted-foreground">
          <span className="bg-card px-2">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled
        title="Coming soon"
        aria-label="Continue with Google (coming soon)"
      >
        Continue with Google
      </Button>

      <p className="text-center font-body text-sm text-muted-foreground">
        {isLogin ? (
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
