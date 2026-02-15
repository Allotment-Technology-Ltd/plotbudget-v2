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
type Payer = 'me' | 'partner' | 'both';

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

/** Short situational subtitle: what belongs in this category. */
const categorySubtitles: Record<SeedType, string> = {
  need: 'Essentials you must pay — rent, utilities, groceries, insurance.',
  want: 'Discretionary spending — subscriptions, eating out, hobbies, non-essential shopping.',
  savings: 'Money you set aside this cycle — goals, emergency fund, holiday.',
  repay: 'Extra debt repayment — paying down loans or cards beyond the minimum.',
};

interface SeedsListProps {
  category: SeedType;
  seeds: Seed[];
  household: Household;
  paycycle: Paycycle;
  pots: Pot[];
  repayments: Repayment[];
  isRitualMode?: boolean;
  isCycleLocked?: boolean;
  onAdd: () => void;
  onEdit: (seed: Seed) => void;
  onDelete: (seed: Seed) => void;
  onMarkPaid?: (seedId: string, payer: Payer) => void;
  onUnmarkPaid?: (seedId: string, payer: Payer) => void;
  isPartner?: boolean;
  otherLabel?: string;
  ownerLabel?: string;
  partnerLabel?: string;
}

export function SeedsList({
  category,
  seeds,
  household,
  pots,
  repayments,
  isRitualMode = false,
  isCycleLocked = false,
  onAdd,
  onEdit,
  onDelete,
  onMarkPaid,
  onUnmarkPaid,
  isPartner = false,
  otherLabel = 'Partner',
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
}: SeedsListProps) {
  const categoryLabel = categoryLabels[category];
  const singularLabel = singularLabels[category];
  const totalSeeds = seeds.length;
  const paidSeeds = seeds.filter((s) => s.is_paid).length;

  return (
    <section
      className="bg-card rounded-lg p-6 border border-border"
      aria-labelledby={`seeds-${category}-heading`}
      aria-describedby={`seeds-${category}-subtitle`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h2
            id={`seeds-${category}-heading`}
            className="font-heading text-xl uppercase tracking-wider text-foreground break-words"
          >
            {categoryLabel} ({seeds.length})
          </h2>
          {isRitualMode && totalSeeds > 0 && (
            <span
              className="text-sm text-muted-foreground"
              aria-label={`${paidSeeds} of ${totalSeeds} paid in ${categoryLabel}`}
            >
              {paidSeeds}/{totalSeeds} paid
            </span>
          )}
        </div>
        {!isCycleLocked && (
          <Button
            variant="outline"
            className="px-4 py-2 text-sm shrink-0"
            onClick={onAdd}
            data-testid={
              category === 'need'
                ? 'add-seed-button'
                : category === 'savings'
                  ? 'add-pot-button'
                  : category === 'repay'
                    ? 'add-repayment-button'
                    : undefined
            }
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Add {singularLabel}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4" id={`seeds-${category}-subtitle`}>
        {categorySubtitles[category]}
      </p>

      {seeds.length === 0 ? (
        <div
          className="text-center py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
          {...(category === 'need'
            ? { 'data-testid': 'blueprint-empty-state' as const }
            : {})}
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
                  isRitualMode={isRitualMode}
                  isCycleLocked={isCycleLocked}
                  onMarkPaid={onMarkPaid}
                  onUnmarkPaid={onUnmarkPaid}
                  isPartner={isPartner}
                  otherLabel={otherLabel}
                  ownerLabel={ownerLabel}
                  partnerLabel={partnerLabel}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
