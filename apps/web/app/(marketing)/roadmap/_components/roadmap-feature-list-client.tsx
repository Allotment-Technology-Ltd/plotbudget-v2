'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMyRoadmapVoteEligibility } from '@/lib/actions/roadmap-actions';
import { RoadmapModuleCard } from './roadmap-module-card';
import type { RoadmapFeatureWithVotes } from '@/lib/actions/roadmap-actions';

const SECTION_LABELS: Record<string, { title: string; subtitle: string }> = {
  now: { title: 'Now', subtitle: 'Currently shipping' },
  next: { title: 'Next', subtitle: 'In active development' },
  later: { title: 'Later', subtitle: 'Planned for future' },
  shipped: { title: 'Shipped', subtitle: 'Already live' },
};

type ByStatus = {
  now: RoadmapFeatureWithVotes[];
  next: RoadmapFeatureWithVotes[];
  later: RoadmapFeatureWithVotes[];
  shipped: RoadmapFeatureWithVotes[];
};

export function RoadmapFeatureListClient({ byStatus }: { byStatus: ByStatus }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canVote, setCanVote] = useState(false);

  useEffect(() => {
    getMyRoadmapVoteEligibility().then(({ isAuthenticated: auth, canVote: vote }) => {
      setIsAuthenticated(auth);
      setCanVote(vote);
    });
  }, []);

  return (
    <>
      {/* Timeline sections */}
      <section className="content-wrapper section-padding border-t border-border" aria-label="Roadmap timeline">
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
                  {list.map((feature) => (
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
        className="content-wrapper section-padding border-t border-border"
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
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-heading text-sm uppercase tracking-wider text-primary-foreground hover:bg-primary/90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Join founding members →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
