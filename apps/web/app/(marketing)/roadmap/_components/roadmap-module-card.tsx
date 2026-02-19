'use client';

import { useState } from 'react';
import {
  PoundSterling,
  Layers,
  CheckSquare,
  Calendar,
  Utensils,
  Plane,
  Lock,
  Home,
  Baby,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RoadmapVoteButton } from './roadmap-vote-button';
import type { RoadmapFeatureWithVotes } from '@/lib/actions/roadmap-actions';

/** Icon by feature icon_name. Money uses GBP (£). */
const ICON_MAP: Record<string, typeof Layers> = {
  DollarSign: PoundSterling,
  Layers,
  CheckSquare,
  Calendar,
  Utensils,
  Plane,
  Lock,
  Home,
  Baby,
};

const STATUS_STYLES: Record<string, string> = {
  now: 'border-primary bg-primary/20 text-primary',
  next: 'border-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-400',
  later: 'border-border bg-muted/30 text-muted-foreground',
  shipped: 'border-primary bg-primary/20 text-primary',
};

type RoadmapModuleCardProps = {
  feature: RoadmapFeatureWithVotes;
  isAuthenticated: boolean;
  canVote: boolean;
};

export function RoadmapModuleCard({ feature, isAuthenticated, canVote }: RoadmapModuleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[feature.icon_name] ?? Layers;
  const statusStyle = STATUS_STYLES[feature.status] ?? STATUS_STYLES.later;

  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card flex flex-col"
      aria-labelledby={`roadmap-feature-${feature.id}`}
    >
      <div className="flex gap-4 p-6 md:p-8">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-primary/40 text-primary"
          aria-hidden
        >
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            id={`roadmap-feature-${feature.id}`}
            className="font-heading text-lg md:text-xl font-bold uppercase tracking-wider text-foreground"
          >
            {feature.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-4 min-w-0">
        <RoadmapVoteButton
          featureId={feature.id}
          initialCount={feature.vote_count}
          initialVoted={feature.user_has_voted}
          isAuthenticated={isAuthenticated}
          canVote={canVote}
        />
        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
          <span
            className={`min-w-0 max-w-full truncate rounded-md border px-2 py-1 font-heading text-xs uppercase tracking-wider ${statusStyle}`}
            title={feature.estimated_timeline ?? feature.status}
          >
            {feature.estimated_timeline ?? feature.status}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            aria-controls={`roadmap-features-${feature.id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {expanded ? (
              <ChevronUp className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronDown className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {expanded && feature.key_features.length > 0 && (
        <div
          id={`roadmap-features-${feature.id}`}
          className="border-t border-border bg-muted/20 px-6 pb-6 pt-2 md:px-8 md:pb-8 md:pt-4"
          role="region"
          aria-labelledby={`roadmap-feature-${feature.id}`}
        >
          <p className="font-heading text-xs uppercase tracking-wider text-primary mb-3">
            Key features
          </p>
          <ul className="space-y-2 text-sm text-foreground" role="list">
            {feature.key_features.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
