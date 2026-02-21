import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { acceptPartnerInvite } from '@/app/actions/partner-invite';

interface Props {
  searchParams: Promise<{ t?: string }>;
}

export default async function PartnerJoinPage({ searchParams }: Props) {
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="partner-join-invalid">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Invitation Link</h1>
          <p className="text-muted-foreground">
            This link is missing a required token.
          </p>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: householdData, error } = await admin
    .from('households')
    .select('id, owner_id')
    .eq('partner_auth_token', token)
    .eq('partner_invite_status', 'pending')
    .single();

  type HouseholdRow = { id: string; owner_id: string };
  const household = householdData as HouseholdRow | null;

  if (error || !household) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="partner-join-expired">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid or Expired Invitation</h1>
          <p className="text-muted-foreground">
            This invitation link is no longer valid.
          </p>
        </div>
      </div>
    );
  }

  const { data: ownerData } = await admin
    .from('users')
    .select('email, display_name')
    .eq('id', household.owner_id)
    .single();

  type OwnerRow = { email: string | null; display_name: string | null };
  const owner = ownerData as OwnerRow | null;
  const ownerName =
    (owner?.display_name ?? '')?.trim() || owner?.email || 'Your partner';

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completeUrl = `/partner/complete?t=${encodeURIComponent(token)}`;

  // Authenticated user with valid token: accept invite and go straight to dashboard (no extra screen)
  if (user) {
    await acceptPartnerInvite(token);
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="partner-join-unauthenticated">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold" data-testid="partner-join-heading">Join as partner</h1>
          <p className="mt-2 text-muted-foreground">
            {ownerName} invited you to budget together on PLOT.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold">What you&apos;ll get access to:</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>✓ View all household seeds and pots</li>
            <li>✓ Mark your bills as paid</li>
            <li>✓ See budget overview</li>
            <li>✓ Collaborate on payday rituals</li>
          </ul>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Create an account or sign in to accept the invitation. You&apos;ll
          use this account every time you open PLOT.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/signup?redirect=${encodeURIComponent(completeUrl)}`}
            data-testid="partner-join-signup"
            className="btn-primary inline-flex w-full items-center justify-center rounded-md px-6 py-3 font-heading text-cta uppercase tracking-widest"
          >
            Create account
          </Link>
          <Link
            href={`/login?redirect=${encodeURIComponent(completeUrl)}`}
            data-testid="partner-join-login"
            className="inline-flex w-full items-center justify-center rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
