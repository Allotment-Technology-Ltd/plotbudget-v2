import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FeedbackForm } from '@/components/feedback/feedback-form';

export const metadata: Metadata = {
  title: 'Feedback & bugs | PLOT',
  description: 'Send feedback or report a bug',
};

export default async function DashboardFeedbackPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="content-wrapper py-8">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wider text-foreground mb-2">
        Feedback & bugs
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Tell us what’s working, what isn’t, or report a bug. We use this to improve the app.
      </p>
      <FeedbackForm />
    </div>
  );
}
