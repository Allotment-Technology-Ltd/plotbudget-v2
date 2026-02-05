'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SeedCard } from './seed-card';
import type { Database } from '@/lib/supabase/database.types';

type Seed = Database['public']['Tables']['seeds']['Row'];
type Household = Database['public']['Tables']['households']['Row'];
type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];

type SeedType = 'need' | 'want' | 'savings' | 'repay';

const POT_STATUS_LABELS: Record<string, string> = {
  active: 'Saving',
  complete: 'Accomplished',
  paused: 'Paused',
};

const REPAYMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Clearing',
  paid: 'Cleared',
  paused: 'Paused',
};

const categoryLabels: Record<SeedType, string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repayments',
};

const singularLabels: Record<SeedType, string> = {
  need: 'Need',
  want: 'Want',
  savings: 'Saving',
  repay: 'Repayment',
};

interface SeedsListProps {
  category: SeedType;
  seeds: Seed[];
  household: Household;
  paycycle: Paycycle;
  pots: Pot[];
  repayments: Repayment[];
  onAdd: () => void;
  onEdit: (seed: Seed) => void;
  onDelete: (seed: Seed) => void;
}

export function SeedsList({
  category,
  seeds,
  household,
  pots,
  repayments,
  onAdd,
  onEdit,
  onDelete,
}: SeedsListProps) {
  const categoryLabel = categoryLabels[category];
  const singularLabel = singularLabels[category];

  return (
    <section
      className="bg-card rounded-lg p-6 border border-border"
      aria-labelledby={`seeds-${category}-heading`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          id={`seeds-${category}-heading`}
          className="font-heading text-xl uppercase tracking-wider text-foreground"
        >
          {categoryLabel} ({seeds.length})
        </h2>
        <Button variant="outline" className="px-4 py-2 text-sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" aria-hidden />
          Add {singularLabel}
        </Button>
      </div>

      {seeds.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm">No {categoryLabel.toLowerCase()} added yet.</p>
          <p className="text-xs mt-1">
            Click &quot;Add {singularLabel}&quot; to get started.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label={`${categoryLabel} expenses`}>
          {seeds.map((seed) => {
            const linkedPot = seed.linked_pot_id
              ? pots.find((p) => p.id === seed.linked_pot_id)
              : null;
            const linkedRepayment = seed.linked_repayment_id
              ? repayments.find((r) => r.id === seed.linked_repayment_id)
              : null;
            return (
              <li key={seed.id}>
                <SeedCard
                  seed={seed}
                  household={household}
                  linkedPot={linkedPot ?? undefined}
                  linkedRepayment={linkedRepayment ?? undefined}
                  statusLabel={
                    linkedPot
                      ? POT_STATUS_LABELS[linkedPot.status]
                      : linkedRepayment
                        ? REPAYMENT_STATUS_LABELS[linkedRepayment.status]
                        : undefined
                  }
                  onEdit={() => onEdit(seed)}
                  onDelete={() => onDelete(seed)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
