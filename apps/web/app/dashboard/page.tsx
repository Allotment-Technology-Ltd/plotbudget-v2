'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function DashboardHoldingPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/8">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/dashboard"
            className="font-heading text-xl uppercase tracking-widest text-foreground"
          >
            PLOT
          </Link>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="content-wrapper section-padding">
        <div className="bg-card rounded-lg border border-border/8 p-8 text-center">
          <h1 className="font-heading text-headline-sm uppercase tracking-wider text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground font-body mb-6">
            Holding page — you’re logged in. Full dashboard coming in a later phase.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">Go to Sign up</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
