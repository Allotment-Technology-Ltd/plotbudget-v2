'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function OnboardingHoldingPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border/8 p-8 text-center space-y-6">
          <h1 className="font-heading text-headline-sm uppercase tracking-wider text-foreground">
            Onboarding
          </h1>
          <p className="text-muted-foreground font-body">
            Holding page — onboarding flow will be built in a later phase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">Go to Dashboard</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
