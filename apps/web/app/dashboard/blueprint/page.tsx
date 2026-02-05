import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

type UserProfile = Pick<
  Database['public']['Tables']['users']['Row'],
  'household_id' | 'current_paycycle_id' | 'has_completed_onboarding'
>;
type HouseholdRow = Database['public']['Tables']['households']['Row'];
type PaycycleDates = Pick<
  Database['public']['Tables']['paycycles']['Row'],
  'start_date' | 'end_date'
>;

export default async function BlueprintPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id, current_paycycle_id, has_completed_onboarding')
    .eq('id', user.id)
    .single()) as { data: UserProfile | null };

  if (!profile?.has_completed_onboarding) {
    redirect('/onboarding');
  }

  const { data: household } = (await supabase
    .from('households')
    .select('*')
    .eq('id', profile.household_id!)
    .single()) as { data: HouseholdRow | null };

  const { data: paycycle } = (profile.current_paycycle_id
    ? await supabase
        .from('paycycles')
        .select('start_date, end_date')
        .eq('id', profile.current_paycycle_id)
        .single()
    : { data: null }) as { data: PaycycleDates | null };

  const startDate = paycycle?.start_date
    ? new Date(paycycle.start_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const endDate = paycycle?.end_date
    ? new Date(paycycle.end_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-headline-sm md:text-headline uppercase">
                Your Blueprint
              </h1>
              <p className="text-muted-foreground font-body mt-1">
                {household?.is_couple
                  ? `Managing £${(household.total_monthly_income ?? 0).toFixed(2)} together`
                  : `Managing £${(household?.total_monthly_income ?? 0).toFixed(2)} monthly`}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="content-wrapper section-padding">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg p-12 text-center border border-border">
            <div className="inline-block p-4 rounded-full bg-primary/10 mb-6">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h2 className="font-heading text-2xl uppercase mb-3">
              Your Blueprint is Ready
            </h2>
            <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
              Start adding your expenses, bills, and savings goals to populate
              your budget. Your paycycle runs from <strong>{startDate}</strong>{' '}
              to <strong>{endDate}</strong>.
            </p>

            <Link
              href="/dashboard/blueprint"
              className="btn-primary inline-flex items-center justify-center rounded-md px-6 py-3 text-lg"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Your First Expense
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { name: 'Needs', color: 'bg-needs', percent: 50 },
              { name: 'Wants', color: 'bg-wants', percent: 30 },
              { name: 'Savings', color: 'bg-savings', percent: 10 },
              { name: 'Repay', color: 'bg-repay', percent: 10 },
            ].map((category) => (
              <div
                key={category.name}
                className="bg-card rounded-md p-4 border border-border"
              >
                <div
                  className={`w-3 h-3 rounded-full ${category.color} mb-2`}
                  aria-hidden
                />
                <p className="font-heading text-sm uppercase tracking-wider">
                  {category.name}
                </p>
                <p className="text-2xl font-display mt-1">
                  {category.percent}%
                </p>
                <p className="text-sm text-muted-foreground">
                  £
                  {(
                    ((household?.total_monthly_income ?? 0) * category.percent) /
                    100
                  ).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-4 rounded-md bg-primary/10 border border-primary/30">
            <p className="text-sm font-body text-center">
              <strong className="text-primary">Phase 4 Coming Soon:</strong>{' '}
              Full budget management, expense tracking, and progress
              visualization will be available in the next release.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
