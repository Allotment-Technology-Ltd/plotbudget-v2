import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getRoadmapFeaturesWithVotes } from '@/lib/actions/roadmap-actions';
import { RoadmapModuleCard } from './_components/roadmap-module-card';
import RoadmapLoading from './loading';

export const metadata: Metadata = {
  title: 'Roadmap',
  description:
    "See what we're building: from budgeting app to household operating system. Eight interconnected modules launching over the next 12 months.",
};

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
  now: { title: 'Now', subtitle: 'Currently shipping' },
  next: { title: 'Next', subtitle: 'In active development' },
  later: { title: 'Later', subtitle: 'Planned for future' },
  shipped: { title: 'Shipped', subtitle: 'Already live' },
};

function RoadmapContent() {
  return (
    <Suspense fallback={<RoadmapLoading />}>
      <RoadmapPageInner />
    </Suspense>
  );
}

async function RoadmapPageInner() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  let canVote = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .maybeSingle();
    const householdId = (profile as { household_id: string | null } | null)?.household_id ?? null;
    if (householdId) {
      const { data: household } = await supabase
        .from('households')
        .select('founding_member_until')
        .eq('id', householdId)
        .maybeSingle();
      const until = (household as { founding_member_until: string | null } | null)?.founding_member_until ?? null;
      canVote = !!until && new Date(until) > new Date();
    }
  }

  const { features, error } = await getRoadmapFeaturesWithVotes();
  if (error) {
    return (
      <div className="content-wrapper py-16 text-center">
        <p className="text-destructive">Unable to load roadmap. Please try again later.</p>
      </div>
    );
  }

  const byStatus = {
    now: features.filter((f) => f.status === 'now'),
    next: features.filter((f) => f.status === 'next'),
    later: features.filter((f) => f.status === 'later'),
    shipped: features.filter((f) => f.status === 'shipped'),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section
        className="content-wrapper py-16 md:py-20 text-center"
        aria-labelledby="roadmap-title"
      >
        <h1
          id="roadmap-title"
          className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-wider text-foreground mb-6"
        >
          Roadmap
        </h1>
        <p className="font-heading text-lg md:text-xl uppercase tracking-wider text-muted-foreground mb-6">
          From budgeting app to household operating system
        </p>
        <div className="max-w-prose mx-auto space-y-4 text-foreground text-left">
          <p>
            PLOT launched with Money (budgeting and the payday ritual). Over the coming year,
            we&apos;re expanding into a complete household operating system with eight
            interconnected modules.
          </p>
          <p>
            Each module follows the same philosophy: opinionated ceremonies instead of blank
            canvases. Simple rituals instead of daily tracking. Built for households, not
            individuals.
          </p>
        </div>
      </section>

      {/* Why an operating system callout */}
      <section className="content-wrapper py-8" aria-label="Why an operating system">
        <div className="max-w-3xl mx-auto rounded-xl border-l-4 border-primary border-border bg-card p-6 md:p-8">
          <h2 className="font-heading text-lg md:text-xl font-bold uppercase tracking-wider text-foreground mb-4">
            Why an Operating System?
          </h2>
          <p className="text-foreground mb-4">
            These modules aren&apos;t separate apps. They talk to each other:
          </p>
          <ul className="text-sm text-foreground space-y-2" role="list">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">—</span>
              <span>
                A holiday automatically creates: a savings pot (Money), calendar events
                (Calendar), packing tasks (Tasks), and document storage (Vault)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">—</span>
              <span>
                A renovation project links to: a repayment plan (Money), task phases (Tasks),
                and contractor info (Home Maintenance)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">—</span>
              <span>
                A meal plan generates: shopping list items (Meals) and spending tracking (Money)
              </span>
            </li>
          </ul>
          <p className="text-foreground mt-4 font-medium">
            That&apos;s what makes a household system different from a collection of separate
            apps—single-purpose tools can&apos;t do this.
          </p>
        </div>
      </section>

      {/* Timeline sections */}
      <section className="content-wrapper py-12 md:py-16 border-t border-border" aria-label="Roadmap timeline">
        <div className="max-w-4xl mx-auto space-y-16 md:space-y-20">
          {(['now', 'next', 'later', 'shipped'] as const).map((status) => {
            const list = byStatus[status];
            if (list.length === 0) return null;
            const { title, subtitle } = SECTION_LABELS[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-heading text-sm uppercase tracking-widest text-primary">
                    {title}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>
                <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
                <ul className="space-y-4" role="list">
                  {list
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((feature) => (
                      <li key={feature.id}>
                        <RoadmapModuleCard
                          feature={feature}
                          isAuthenticated={isAuthenticated}
                          canVote={canVote}
                        />
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* How we decide */}
      <section
        className="content-wrapper py-16 border-t border-border"
        aria-labelledby="how-we-decide-title"
      >
        <div className="max-w-prose mx-auto">
          <h2
            id="how-we-decide-title"
            className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground mb-6"
          >
            How we decide what to build
          </h2>
          <div className="space-y-4 text-foreground">
            <p>
              PLOT&apos;s roadmap isn&apos;t fixed. It&apos;s shaped by founding member feedback,
              usage patterns, and demand signals.
            </p>
            <p>
              The order above (Tasks → Calendar → Meals → Holidays → Vault → Home → Kids) is our
              current hypothesis based on:
            </p>
            <ul className="list-none space-y-2 pl-0" role="list">
              <li className="flex gap-2">
                <span className="text-primary shrink-0">—</span>
                <span>Which modules unlock the most value fastest</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">—</span>
                <span>
                  Which modules depend on others (Calendar needs Tasks, Meals needs Calendar)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">—</span>
                <span>Which problems founding members report most frequently</span>
              </li>
            </ul>
            <p>
              We validate demand at each stage. Your votes help us prioritise. If founding
              members overwhelmingly want Holidays before Meals, we&apos;ll adjust.
            </p>
            <p className="font-medium">
              {canVote
                ? 'Your votes are counted. Thank you for helping shape the roadmap.'
                : isAuthenticated
                  ? 'Roadmap voting is for founding members. Join as a founding member to influence what we build next.'
                  : 'Want to influence what gets built next?'}
            </p>
          </div>
          {!canVote && (
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Join founding members →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function RoadmapPage() {
  return <RoadmapContent />;
}
