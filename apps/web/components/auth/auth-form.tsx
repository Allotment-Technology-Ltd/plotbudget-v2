// apps/web/components/auth/auth-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

// Separate schemas for login and signup
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

// Infer types from schemas
type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isLogin = mode === 'login';

  // Use conditional type for form data
  const form = useForm<SignupFormData>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
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
      if (isLogin) {
        // Login flow
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

        toast.success('Welcome back!');
        router.push('/dashboard');
      } else {
        // Signup flow
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

        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-label={isLogin ? 'Sign in' : 'Create account'}
      >
        {/* Email field */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...form.register('email')}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {isLogin && (
              <Link
                href="/reset-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder={isLogin ? '••••••••' : 'e.g. coffee-piano-sunset'}
            {...form.register('password')}
            aria-invalid={!!form.formState.errors.password}
            aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
          />
          {form.formState.errors.password && (
            <p id="password-error" className="text-sm text-destructive" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password field (signup only) */}
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register('confirmPassword')}
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
        )}

        {/* Root error (general auth errors) */}
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

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Google OAuth placeholder */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled
        title="Coming soon"
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
        Continue with Google
      </Button>

      {/* Switch mode link */}
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <Link
          href={isLogin ? '/signup' : '/login'}
          className="text-primary hover:underline font-medium"
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}