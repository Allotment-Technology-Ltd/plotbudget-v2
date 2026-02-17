'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PageProps = {
  params?: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default function ResetPasswordPage(_props: PageProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm">
        <div className="space-y-3">
          <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider text-foreground">
            Check your email
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            If we have an account with that email, we&apos;ve sent a link to
            reset your password. Check your inbox and spam folder.
          </p>
          <p className="text-muted-foreground font-body text-sm">
            If you usually sign in with Google, Apple, or an email link, use
            that option on the login page instead—you don&apos;t have a
            password to reset.
          </p>
        </div>

        <Link
          href="/login"
          className="block text-center font-body text-sm text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl p-8 md:p-10 space-y-6 shadow-sm">
      <div className="space-y-2">
        <p className="font-heading text-xs uppercase tracking-[0.2em] text-primary">
          Reset password
        </p>
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider text-foreground">
          Reset password
        </h1>
        <p className="text-muted-foreground font-body text-sm">
          Enter your email and we&apos;ll send a link to reset your password.
          If you sign in with Google, Apple, or an email link, use the login
          page instead.
        </p>
      </div>

      <form
        method="post"
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-label="Reset password"
      >
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 font-body text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          {/* Input has no label prop - use Label component above */}
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="normal-case"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" isLoading={loading} disabled={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center font-body text-sm text-muted-foreground">
        <Link
          href="/login"
          className="text-primary underline underline-offset-2 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
