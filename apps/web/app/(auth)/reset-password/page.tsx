'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
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
      <div className="bg-card rounded-lg p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
            Check your email
          </h1>
          <p className="text-muted-foreground font-body">
            We&apos;ve sent you a link to reset your password. Check your
            inbox and follow the link.
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
    <div className="bg-card rounded-lg p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Reset Password
        </h1>
        <p className="text-muted-foreground font-body">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      <form
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
