'use client';

import { Button } from '@/components/ui/button';
import { Trash, Repeat, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/lib/supabase/database.types';

type Seed = Database['public']['Tables']['seeds']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

type Payer = 'me' | 'partner' | 'both';

interface SeedCardProps {
  seed: Seed;
  household: Household;
  linkedPot?: { current_amount: number; target_amount: number } | null;
  linkedRepayment?: { current_balance: number } | null;
  statusLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
  isRitualMode?: boolean;
  onMarkPaid?: (seedId: string, payer: Payer) => void;
  onUnmarkPaid?: (seedId: string, payer: Payer) => void;
}

const paymentSourceBadge = {
  me: { label: 'ME', color: 'bg-primary/20 text-primary' },
  partner: {
    label: 'PARTNER',
    color: 'bg-secondary/20 text-secondary-foreground',
  },
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
  isRitualMode = false,
  onMarkPaid,
  onUnmarkPaid,
}: SeedCardProps) {
  const badge = paymentSourceBadge[seed.payment_source];
  const partnerName = household.partner_name || 'Partner';
  const seedSlug = seed.name.toLowerCase().replace(/\s+/g, '-');
  const isJointCouple =
    seed.payment_source === 'joint' && household.is_couple;
  const canMarkUnmark = isRitualMode && (onMarkPaid || onUnmarkPaid);

  const handleCheckboxChange = (payer: Payer, checked: boolean) => {
    if (checked && onMarkPaid) onMarkPaid(seed.id, payer);
    if (!checked && onUnmarkPaid) onUnmarkPaid(seed.id, payer);
  };

  const isPaid = !!seed.is_paid;
  const canEditOrDelete = !isRitualMode || !isPaid;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrDelete) {
      toast.info('Mark this bill as unpaid before editing.');
      return;
    }
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrDelete) {
      toast.info('Mark this bill as unpaid before deleting.');
      return;
    }
    onDelete();
  };

  const cardContent = (
    <>
      {canMarkUnmark && (
        <div className="flex items-center gap-2 mr-4 shrink-0" role="group">
          {isJointCouple ? (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!seed.is_paid_me}
                  onChange={(e) =>
                    handleCheckboxChange('me', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
                  aria-label={`Mark ${seed.name} - your portion as paid`}
                  data-testid={`seed-paid-me-${seedSlug}`}
                />
                <span className="text-muted-foreground">You</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!seed.is_paid_partner}
                  onChange={(e) =>
                    handleCheckboxChange('partner', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
                  aria-label={`Mark ${seed.name} - ${partnerName}'s portion as paid`}
                  data-testid={`seed-paid-partner-${seedSlug}`}
                />
                <span className="text-muted-foreground">{partnerName}</span>
              </label>
            </div>
          ) : (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!seed.is_paid}
                onChange={(e) =>
                  handleCheckboxChange('both', e.target.checked)
                }
                className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
                aria-label={`Mark ${seed.name} as paid`}
                data-testid={`seed-paid-${seedSlug}`}
              />
            </label>
          )}
        </div>
      )}

      {seed.is_paid && isRitualMode && (
        <div
          className="flex items-center gap-2 mr-4 shrink-0 text-primary"
          aria-label={`${seed.name} is paid`}
        >
          <CheckCircle2 className="w-5 h-5" aria-hidden />
          <span className="text-xs font-medium uppercase">Paid</span>
        </div>
      )}

      <div
        className={`flex-1 min-w-0 ${canEditOrDelete ? 'cursor-pointer' : ''}`}
        data-testid={`edit-seed-${seedSlug}`}
        role="button"
        tabIndex={0}
        onClick={handleEditClick}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (canEditOrDelete) onEdit();
            else toast.info('Mark this bill as unpaid before editing.');
          }
        }}
        aria-label={canEditOrDelete ? `Edit ${seed.name}` : `${seed.name} (mark as unpaid to edit)`}
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
          onClick={handleDeleteClick}
          aria-label={canEditOrDelete ? `Delete ${seed.name}` : `Delete ${seed.name} (mark as unpaid first)`}
          data-testid={`delete-seed-${seedSlug}`}
        >
          <Trash className="w-4 h-4" aria-hidden />
        </Button>
      </div>
    </>
  );

  const borderClass = isPaid && isRitualMode
    ? 'border-primary/50 bg-primary/5'
    : 'border-border hover:border-primary/30';

  return (
    <div
      className={`flex items-center justify-between p-4 bg-background rounded-md border transition-colors gap-4 ${!canEditOrDelete ? '' : 'cursor-pointer group hover:border-primary/30'} ${borderClass}`}
      data-testid={`seed-card-${seedSlug}`}
    >
      {cardContent}
    </div>
  );
}
