import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { acceptPartnerInvite } from '@/app/actions/partner-invite';
import { Button } from '@/components/ui/button';

interface Props {
  searchParams: Promise<{ t?: string }>;
}

export default async function PartnerJoinPage({ searchParams }: Props) {
  const { t: token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid Invitation Link</h1>
          <p className="text-muted-foreground">
            This link is missing a required token.
          </p>
        </div>
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: household, error } = await supabase
    .from('households')
    .select('id, owner_id')
    .eq('partner_auth_token', token)
    .eq('partner_invite_status', 'pending')
    .single();

  if (error || !household) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invalid or Expired Invitation</h1>
          <p className="text-muted-foreground">
            This invitation link is no longer valid.
          </p>
        </div>
      </div>
    );
  }

  const { data: owner } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', household.owner_id)
    .single();

  const ownerName =
    (owner?.display_name as string | null)?.trim() || owner?.email || 'Your partner';

  async function handleAccept(formData: FormData) {
    'use server';
    const t = formData.get('token') as string;
    if (!t) return;
    await acceptPartnerInvite(t);

    const cookieStore = await cookies();
    cookieStore.set('partner_auth_token', t, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to PLOT!</h1>
          <p className="mt-2 text-muted-foreground">
            {ownerName} invited you to budget together.
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

        <form action={handleAccept} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <Button type="submit" className="w-full">
            Accept & Continue →
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          By accepting, you&apos;ll be able to access this household&apos;s
          budget data.
        </p>
      </div>
    </div>
  );
}
