import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getRoadmapFeaturesWithVotes } from '@/lib/actions/roadmap-actions';
import { RoadmapFeatureListClient } from './_components/roadmap-feature-list-client';
import RoadmapLoading from './loading';

export const metadata: Metadata = {
  title: 'Roadmap',
  description:
    "See what we're building: from budgeting app to household operating system. Eight interconnected modules launching over the next 12 months.",
};

function RoadmapContent() {
  return (
    <Suspense fallback={<RoadmapLoading />}>
      <RoadmapPageInner />
    </Suspense>
  );
}

async function RoadmapPageInner() {
  const { features, error } = await getRoadmapFeaturesWithVotes();
  if (error) {
    return (
      <div className="content-wrapper py-16 text-center">
        <p className="text-destructive">Unable to load roadmap. Please try again later.</p>
      </div>
    );
  }

  const byStatus = {
    now: features.filter((f) => f.status === 'now').sort((a, b) => Number(b.display_order) - Number(a.display_order)),
    next: features.filter((f) => f.status === 'next').sort((a, b) => Number(b.display_order) - Number(a.display_order)),
    later: features.filter((f) => f.status === 'later').sort((a, b) => Number(b.display_order) - Number(a.display_order)),
    shipped: features.filter((f) => f.status === 'shipped').sort((a, b) => Number(b.display_order) - Number(a.display_order)),
  };

  return (
    <>
      {/* Hero */}
      <section
        className="content-wrapper section-padding text-center"
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
      <section className="content-wrapper py-12 md:py-16" aria-label="Why an operating system">
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
            apps&mdash;single-purpose tools can&apos;t do this.
          </p>
        </div>
      </section>

      <RoadmapFeatureListClient byStatus={byStatus} />
    </>
  );
}

export default function RoadmapPage() {
  return <RoadmapContent />;
}
