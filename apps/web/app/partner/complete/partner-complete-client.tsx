'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { acceptPartnerInvite } from '@/app/actions/partner-invite';

/**
 * Client-only content: after signup/login when the user was invited as a partner.
 * Session is available client-side here, so we accept the invite and redirect to dashboard.
 * Fixes the issue where partner would land on the create-account screen until refresh (server
 * didn't see the new session on the first redirect).
 */
export function PartnerCompleteClient(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('t');
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function run(t: string) {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        // Not logged in — send to join page to sign up or log in
        router.replace(`/partner/join?t=${encodeURIComponent(t)}`);
        return;
      }

      try {
        await acceptPartnerInvite(t);
        if (cancelled) return;
        setStatus('done');
        router.replace('/dashboard');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    run(token);
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="partner-complete-invalid">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid link</h1>
          <p className="text-muted-foreground mt-2">Missing invitation token.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="partner-complete-error">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">The invitation could not be accepted. Try again or ask for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="partner-complete-loading">
      <div className="text-center">
        <p className="text-muted-foreground">Accepting invitation…</p>
      </div>
    </div>
  );
}
