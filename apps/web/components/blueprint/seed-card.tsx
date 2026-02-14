'use client';

import { Button } from '@/components/ui/button';
import { Trash, Repeat, CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { currencySymbol } from '@/lib/utils/currency';
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
  isCycleLocked?: boolean;
  onMarkPaid?: (seedId: string, payer: Payer) => void;
  onUnmarkPaid?: (seedId: string, payer: Payer) => void;
  isPartner?: boolean;
  otherLabel?: string;
}

const paymentSourceBadge = {
  me: { label: 'ME', color: 'bg-primary/20 text-primary' },
  partner: {
    label: 'PARTNER',
    color: 'bg-secondary/20 text-secondary-foreground',
  },
  joint: { label: 'JOINT', color: 'bg-accent/20 text-accent-foreground' },
} as const;

function formatDueDate(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-GB', opts);
}

export function SeedCard({
  seed,
  household,
  linkedPot,
  linkedRepayment,
  statusLabel,
  onEdit,
  onDelete,
  isRitualMode = false,
  isCycleLocked = false,
  onMarkPaid,
  onUnmarkPaid,
  isPartner = false,
  otherLabel = 'Partner',
}: SeedCardProps) {
  const badge = paymentSourceBadge[seed.payment_source];
  const otherName = otherLabel;
  const currency = household.currency || 'GBP';
  const seedSlug = seed.name.toLowerCase().replace(/\s+/g, '-');
  const isJointCouple =
    seed.payment_source === 'joint' && household.is_couple;
  const canMarkUnmark = !isCycleLocked && isRitualMode && (onMarkPaid || onUnmarkPaid);

  const handleCheckboxChange = (payer: Payer, checked: boolean) => {
    if (checked && onMarkPaid) onMarkPaid(seed.id, payer);
    if (!checked && onUnmarkPaid) onUnmarkPaid(seed.id, payer);
  };

  const isPaid = !!seed.is_paid;
  const canEditOrDelete = !isCycleLocked && (!isRitualMode || !isPaid);

  const lockedMessage =
    'Unlock the blueprint first (e.g. to add a new bill), then you can mark bills as unpaid or edit them.';

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrDelete) {
      toast.info(isCycleLocked ? lockedMessage : 'Mark this bill as unpaid before editing.');
      return;
    }
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEditOrDelete) {
      toast.info(isCycleLocked ? lockedMessage : 'Mark this bill as unpaid before deleting.');
      return;
    }
    onDelete();
  };

  const borderClass = isPaid && isRitualMode
    ? 'border-primary/50 bg-primary/5'
    : 'border-border hover:border-primary/30';

  return (
    <div
      className={`p-4 bg-background rounded-md border transition-colors ${!canEditOrDelete ? '' : 'cursor-pointer group hover:border-primary/30'} ${borderClass}`}
      data-testid={`seed-card-${seedSlug}`}
      role="button"
      tabIndex={0}
      onClick={handleEditClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!canEditOrDelete) {
            toast.info(isCycleLocked ? lockedMessage : 'Mark this bill as unpaid before editing.');
          } else {
            onEdit();
          }
        }
      }}
      aria-label={
        canEditOrDelete
          ? `Edit ${seed.name}`
          : isCycleLocked
            ? `${seed.name} (unlock blueprint to edit)`
            : `${seed.name} (mark as unpaid to edit)`
      }
    >
      {/* Top row: checkboxes (or paid badge) | title + tags | amount + delete — on mobile stack title full-width then amount row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Checkboxes or Paid badge — left; clickable area limited so card click target is clear */}
        <div
          className="flex items-start sm:items-center gap-2 shrink-0"
          role="group"
          aria-label="Mark this bill as paid"
          onClick={(e) => e.stopPropagation()}
        >
          {canMarkUnmark && (
            isJointCouple ? (
              <div className="flex flex-row sm:flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-full sm:w-auto" aria-hidden>
                  Mark paid
                </p>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!seed.is_paid_me}
                    onChange={(e) =>
                      handleCheckboxChange('me', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer shrink-0"
                    aria-label={`Mark ${seed.name} - your portion as paid`}
                    data-testid={`seed-paid-me-${seedSlug}`}
                  />
                  <span className="text-muted-foreground">You</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!seed.is_paid_partner}
                    onChange={(e) =>
                      handleCheckboxChange('partner', e.target.checked)
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer shrink-0"
                    aria-label={`Mark ${seed.name} - ${otherName}'s portion as paid`}
                    data-testid={`seed-paid-partner-${seedSlug}`}
                  />
                  <span className="text-muted-foreground">{otherName}</span>
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
                  className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer shrink-0"
                  aria-label={`Mark ${seed.name} as paid`}
                  data-testid={`seed-paid-${seedSlug}`}
                />
                <span className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap ${isPaid ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isPaid ? 'Paid' : 'Mark as paid'}
                </span>
              </label>
            )
          )}
          {seed.is_paid && isRitualMode && !canMarkUnmark && (
            <div
              className="flex items-center gap-1.5 text-primary shrink-0"
              aria-label={`${seed.name} is paid`}
            >
              <CheckCircle2 className="w-5 h-5" aria-hidden />
              <span className="text-xs font-medium uppercase">Paid</span>
            </div>
          )}
        </div>

        {/* Title + optional tags — part of card click target */}
        <div
          className="flex-1 min-w-0 text-left"
          data-testid={`edit-seed-${seedSlug}`}
        >
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h3
              id={`seed-${seed.id}-name`}
              className="font-body font-medium text-foreground uppercase line-clamp-2 break-words"
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
        </div>

        {/* Amount + badge + delete — right-aligned, own row on mobile */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 sm:flex-nowrap min-w-0">
          <div className="text-right min-w-0">
            <p className="font-display text-lg text-foreground break-all">
              {currencySymbol(currency)}{Number(seed.amount).toFixed(2)}
            </p>
            {household.is_couple && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${badge.color}`}
                aria-label={seed.payment_source === 'joint' ? 'From joint account' : `From personal account`}
                title={seed.payment_source === 'joint' ? 'From joint account' : 'From personal account'}
              >
                {badge.label}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 shrink-0 opacity-70 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDeleteClick}
            aria-label={
              canEditOrDelete
                ? `Delete ${seed.name}`
                : isCycleLocked
                  ? `Delete ${seed.name} (unlock blueprint first)`
                  : `Delete ${seed.name} (mark as unpaid first)`
            }
            data-testid={`delete-seed-${seedSlug}`}
          >
            <Trash className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </div>

      {/* Meta row: Added by, Paid by, joint split, due date, pot, repayment — full width below */}
      <div className="mt-2 pl-0 sm:pl-0 space-y-0.5">
        {seed.due_date && (
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5" aria-label={`Due date ${formatDueDate(seed.due_date)}`}>
            <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Due {formatDueDate(seed.due_date)}
          </p>
        )}
        {(household.is_couple && seed.created_by_owner != null) && (
          <p className="text-xs text-muted-foreground" aria-label={`Added by ${seed.created_by_owner ? (isPartner ? otherName : 'you') : (isPartner ? 'you' : otherName)}`}>
            Added by {seed.created_by_owner ? (isPartner ? otherName : 'you') : (isPartner ? 'you' : otherName)}
          </p>
        )}
        {seed.is_paid && isRitualMode && household.is_couple && (
          <p className="text-xs text-muted-foreground">
            Paid by{' '}
            {seed.is_paid_me && seed.is_paid_partner
              ? 'both'
              : seed.is_paid_me && !seed.is_paid_partner
                ? (isPartner ? otherName : 'you')
                : !seed.is_paid_me && seed.is_paid_partner
                  ? (isPartner ? 'you' : otherName)
                  : '—'}
          </p>
        )}
        {seed.payment_source === 'joint' && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            You: {currencySymbol(currency)}{(isPartner ? Number(seed.amount_partner) : Number(seed.amount_me)).toFixed(2)} · {otherName}: {currencySymbol(currency)}
            {(isPartner ? Number(seed.amount_me) : Number(seed.amount_partner)).toFixed(2)}
          </p>
        )}
        {linkedPot && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currencySymbol(currency)}{Number(linkedPot.current_amount).toFixed(0)} / {currencySymbol(currency)}
            {Number(linkedPot.target_amount).toFixed(0)}
          </p>
        )}
        {linkedRepayment && !linkedPot && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currencySymbol(currency)}{Number(linkedRepayment.current_balance).toFixed(0)} remaining
          </p>
        )}
      </div>
    </div>
  );
}
