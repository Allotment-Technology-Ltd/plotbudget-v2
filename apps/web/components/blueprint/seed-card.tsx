'use client';

import { Button } from '@/components/ui/button';
import { Trash, Repeat } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Seed = Database['public']['Tables']['seeds']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface SeedCardProps {
  seed: Seed;
  household: Household;
  linkedPot?: { current_amount: number; target_amount: number } | null;
  linkedRepayment?: { current_balance: number } | null;
  statusLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const paymentSourceBadge = {
  me: { label: 'ME', color: 'bg-primary/20 text-primary' },
  partner: { label: 'PARTNER', color: 'bg-secondary/20 text-secondary-foreground' },
  joint: { label: 'JOINT', color: 'bg-accent/20 text-accent-foreground' },
} as const;

export function SeedCard({
  seed,
  household,
  linkedPot,
  linkedRepayment,
  statusLabel,
  onEdit,
  onDelete,
}: SeedCardProps) {
  const badge = paymentSourceBadge[seed.payment_source];
  const partnerName = household.partner_name || 'Partner';
  const seedSlug = seed.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
      className="flex items-center justify-between p-4 bg-background rounded-md border border-border hover:border-primary/30 transition-colors gap-4 cursor-pointer group"
      aria-label={`Edit ${seed.name}`}
      data-testid={`seed-card-${seedSlug}`}
    >
      <div
        className="flex-1 min-w-0"
        data-testid={`edit-seed-${seedSlug}`}
        role="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit();
          }
        }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h3
            id={`seed-${seed.id}-name`}
            className="font-body font-medium text-foreground truncate"
          >
            {seed.name}
          </h3>
          {seed.is_recurring && (
            <span
              className="text-xs text-muted-foreground flex items-center gap-1 shrink-0"
              aria-label="Recurring expense"
            >
              <Repeat className="w-3 h-3" aria-hidden />
              Recurring
            </span>
          )}
          {statusLabel && (
            <span
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0"
              aria-label={`Status: ${statusLabel}`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        {seed.payment_source === 'joint' && (
          <p className="text-sm text-muted-foreground mt-1">
            You: £{Number(seed.amount_me).toFixed(2)} • {partnerName}: £
            {Number(seed.amount_partner).toFixed(2)}
          </p>
        )}
        {linkedPot && (
          <p className="text-sm text-muted-foreground mt-1">
            £{Number(linkedPot.current_amount).toFixed(0)} / £
            {Number(linkedPot.target_amount).toFixed(0)}
          </p>
        )}
        {linkedRepayment && !linkedPot && (
          <p className="text-sm text-muted-foreground mt-1">
            £{Number(linkedRepayment.current_balance).toFixed(0)} remaining
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-display text-lg text-foreground">
            £{Number(seed.amount).toFixed(2)}
          </p>
          {household.is_couple && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${badge.color}`}
              aria-label={`Payment source: ${badge.label}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          className="h-9 w-9 p-0 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${seed.name}`}
          data-testid={`delete-seed-${seedSlug}`}
        >
          <Trash className="w-4 h-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
