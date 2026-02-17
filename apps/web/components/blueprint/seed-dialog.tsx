'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { createSeed, updateSeed } from '@/lib/actions/seed-actions';
import {
  suggestedSavingsAmount,
  suggestedRepaymentAmount,
} from '@/lib/utils/suggested-amount';
import { currencySymbol, formatCurrency, parseIncome } from '@/lib/utils/currency';
import { validateDueDateInCycle } from '@/lib/utils/date-cycle-validation';
import type { Database } from '@repo/supabase';

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

interface SeedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SeedType | null;
  seed: Seed | null;
  household: Household;
  paycycle: Paycycle;
  pots: Pot[];
  repayments: Repayment[];
  onSuccess: () => void;
  isPartner?: boolean;
  otherLabel?: string;
  ownerLabel?: string;
  partnerLabel?: string;
}

function createSeedFormSchema(paycycle: { start_date: string; end_date: string }) {
  return z
    .object({
      name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
      amountStr: z
        .string()
        .refine((v) => parseIncome(v) >= 0.01, 'Amount must be greater than 0'),
      payment_source: z.enum(['me', 'partner', 'joint']),
      split_ratio: z.number().min(0).max(100).optional(),
      uses_joint_account: z.boolean().default(true),
      is_recurring: z.boolean().default(true),
      due_date: z.string().optional(),
      // Savings: link or create
      link_pot_id: z.string().optional(),
      pot_current_str: z.string().optional(),
      pot_target_str: z.string().optional(),
      pot_target_date: z.string().optional(),
      pot_status: z.enum(['active', 'complete', 'paused']).optional(),
      // Repay: link or create
      link_repayment_id: z.string().optional(),
      repayment_current_str: z.string().optional(),
      repayment_target_date: z.string().optional(),
      repayment_status: z.enum(['active', 'paid', 'paused']).optional(),
    })
    .refine(
      (data) => {
        const result = validateDueDateInCycle(
          data.due_date,
          paycycle.start_date,
          paycycle.end_date
        );
        return result.valid;
      },
      (data) => {
        const result = validateDueDateInCycle(
          data.due_date,
          paycycle.start_date,
          paycycle.end_date
        );
        return {
          message: result.valid ? '' : result.message,
          path: ['due_date'] as const,
        };
      }
    );
}

type SeedFormInput = z.infer<ReturnType<typeof createSeedFormSchema>>;

export function SeedDialog({
  open,
  onOpenChange,
  category,
  seed,
  household,
  paycycle,
  pots,
  repayments,
  onSuccess,
  isPartner = false,
  otherLabel: _otherLabel = 'Partner',
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
}: SeedDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formScrollRef = useRef<HTMLFormElement>(null);
  const currency = household?.currency ?? 'GBP';
  const symbol = currencySymbol(currency);

  const editMode = !!seed;
  const linkedPot = seed?.linked_pot_id
    ? pots.find((p) => p.id === seed.linked_pot_id)
    : null;
  const linkedRepayment = seed?.linked_repayment_id
    ? repayments.find((r) => r.id === seed.linked_repayment_id)
    : null;

  const seedFormSchema = useMemo(
    () => createSeedFormSchema({ start_date: paycycle.start_date, end_date: paycycle.end_date }),
    [paycycle.start_date, paycycle.end_date]
  );
  const form = useForm<SeedFormInput>({
    resolver: zodResolver(seedFormSchema) as Resolver<SeedFormInput>,
    defaultValues: {
      name: '',
      amountStr: '',
      payment_source: 'me' as const,
      split_ratio: Math.round((household.joint_ratio ?? 0.5) * 100),
      uses_joint_account: true,
      is_recurring: true,
      due_date: '',
      link_pot_id: undefined,
      pot_current_str: '',
      pot_target_str: '',
      pot_target_date: '',
      pot_status: 'active',
      link_repayment_id: undefined,
      repayment_current_str: '',
      repayment_target_date: '',
      repayment_status: 'active',
    },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      if (seed) {
        const base = {
          name: seed.name,
          amountStr: seed.amount ? String(seed.amount) : '',
          payment_source: seed.payment_source,
          split_ratio:
            seed.split_ratio != null
              ? Math.round(seed.split_ratio * 100)
              : Math.round((household.joint_ratio ?? 0.5) * 100),
          uses_joint_account: seed.uses_joint_account ?? false,
          is_recurring: seed.is_recurring,
          due_date: (seed as { due_date?: string | null }).due_date ?? '',
        };
        if (linkedPot) {
          form.reset({
            ...base,
            link_pot_id: linkedPot.id,
            pot_current_str: String(linkedPot.current_amount ?? 0),
            pot_target_str: String(linkedPot.target_amount ?? 0),
            pot_target_date: linkedPot.target_date ?? '',
            pot_status: linkedPot.status,
          });
        } else if (linkedRepayment) {
          form.reset({
            ...base,
            link_repayment_id: linkedRepayment.id,
            repayment_current_str: String(linkedRepayment.current_balance ?? 0),
            repayment_target_date: linkedRepayment.target_date ?? '',
            repayment_status: linkedRepayment.status,
          });
        } else {
          form.reset({ ...base });
        }
      } else {
        const defaultPaymentSource = isPartner ? ('partner' as const) : ('me' as const);
        form.reset({
          name: '',
          amountStr: '',
          payment_source: defaultPaymentSource,
          split_ratio: Math.round((household.joint_ratio ?? 0.5) * 100),
          is_recurring: true,
          due_date: '',
          link_pot_id: undefined,
          pot_current_str: '',
          pot_target_str: '',
          pot_target_date: '',
          pot_status: 'active',
          link_repayment_id: undefined,
          repayment_current_str: '',
          repayment_target_date: '',
          repayment_status: 'active',
          uses_joint_account: true,
        });
      }
    }
  }, [open, seed, household.joint_ratio, form, linkedPot, linkedRepayment, isPartner]);

  const paymentSource = form.watch('payment_source');
  const splitRatio = form.watch('split_ratio') ?? 50;
  const amount = parseIncome(form.watch('amountStr')) || 0;
  const isCouple = household.is_couple;

  const potCurrent = parseIncome(form.watch('pot_current_str')) || 0;
  const potTarget = parseIncome(form.watch('pot_target_str')) || 0;
  const potTargetDate = form.watch('pot_target_date') || null;
  const repaymentCurrent = parseIncome(form.watch('repayment_current_str')) || 0;
  const repaymentTargetDate = form.watch('repayment_target_date') || null;

  const suggestedAmount = useMemo(() => {
    const cycleStart = paycycle?.start_date;
    const type = household?.pay_cycle_type;
    const payDay = household?.pay_day ?? undefined;
    if (!cycleStart || !type) return null;
    if (category === 'savings' && potTarget > potCurrent && potTargetDate) {
      return suggestedSavingsAmount(
        potCurrent,
        potTarget,
        cycleStart,
        potTargetDate,
        type,
        payDay
      );
    }
    if (category === 'repay' && repaymentCurrent > 0 && repaymentTargetDate) {
      return suggestedRepaymentAmount(
        repaymentCurrent,
        cycleStart,
        repaymentTargetDate,
        type,
        payDay
      );
    }
    return null;
  }, [
    category,
    paycycle?.start_date,
    household?.pay_cycle_type,
    household?.pay_day,
    potCurrent,
    potTarget,
    potTargetDate,
    repaymentCurrent,
    repaymentTargetDate,
  ]);

  const previewSplit =
    paymentSource === 'joint' && amount > 0
      ? {
          me: amount * (splitRatio / 100),
          partner: amount * (1 - splitRatio / 100),
        }
      : null;

  const onSubmit = form.handleSubmit(async (data) => {
    if (!category) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const amountNum = parseIncome(data.amountStr);
      const payload: Record<string, unknown> = {
        name: data.name,
        amount: amountNum,
        payment_source: isCouple ? data.payment_source : ('me' as const),
        split_ratio:
          isCouple && data.payment_source === 'joint' && data.split_ratio != null
            ? data.split_ratio / 100
            : undefined,
        uses_joint_account:
          isCouple && data.payment_source === 'joint' ? data.uses_joint_account : false,
        is_recurring:
          category === 'savings' || category === 'repay' ? true : data.is_recurring,
      };

      if (category === 'need' || category === 'want' || category === 'savings' || category === 'repay') {
        payload.due_date = data.due_date?.trim() || null;
      }

      if (category === 'savings') {
        if (data.link_pot_id) {
          payload.linked_pot_id = data.link_pot_id;
          if (editMode && seed?.linked_pot_id) {
            payload.pot = {
              current_amount: parseIncome(data.pot_current_str) || 0,
              target_amount: parseIncome(data.pot_target_str) || 0,
              target_date: data.pot_target_date || null,
              status: (data.pot_status ?? 'active') as 'active' | 'complete' | 'paused',
            };
          }
        } else if (data.pot_target_str && parseIncome(data.pot_target_str) > 0) {
          payload.pot = {
            current_amount: parseIncome(data.pot_current_str) || 0,
            target_amount: parseIncome(data.pot_target_str) || 0,
            target_date: data.pot_target_date || null,
            status: (data.pot_status ?? 'active') as 'active' | 'complete' | 'paused',
          };
        }
      }

      if (category === 'repay') {
        if (data.link_repayment_id) {
          payload.linked_repayment_id = data.link_repayment_id;
          if (editMode && seed?.linked_repayment_id) {
            payload.repayment = {
              current_balance: parseIncome(data.repayment_current_str) || 0,
              target_date: data.repayment_target_date || null,
              status: (data.repayment_status ?? 'active') as 'active' | 'paid' | 'paused',
            };
          }
        } else if (data.repayment_current_str && parseIncome(data.repayment_current_str) > 0) {
          payload.repayment = {
            starting_balance: parseIncome(data.repayment_current_str) || 0,
            current_balance: parseIncome(data.repayment_current_str) || 0,
            target_date: data.repayment_target_date || null,
            status: (data.repayment_status ?? 'active') as 'active' | 'paid' | 'paused',
          };
        }
      }

      if (editMode && seed) {
        const result = await updateSeed(seed.id, payload as Parameters<typeof updateSeed>[1]);
        if (!result) {
          setError('Request failed. Please try again.');
          return;
        }
        if (result.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createSeed({
          ...payload,
          type: category,
          paycycle_id: paycycle.id,
          household_id: household.id,
        } as Parameters<typeof createSeed>[0]);
        if (!result) {
          setError('Server did not respond. Please try again.');
          return;
        }
        if (result.error) {
          setError(result.error);
          return;
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  });

  const categoryLabel =
    category === 'need'
      ? 'Need'
      : category === 'want'
        ? 'Want'
        : category === 'savings'
          ? 'Saving'
          : 'Repayment';

  const namePlaceholders: Record<NonNullable<SeedType>, string> = {
    need: 'e.g. Rent, Electric bill, Groceries',
    want: 'e.g. Netflix, Gym membership, Dining out',
    savings: 'e.g. Holiday fund, Emergency fund',
    repay: 'e.g. Credit card, Loan repayment',
  };
  const namePlaceholder = category ? namePlaceholders[category] : 'e.g. Rent, Electric bill';

  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (!target || !formScrollRef.current?.contains(target)) return;
    if (!/^(INPUT|SELECT|TEXTAREA|BUTTON)$/i.test(target.tagName)) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth', inline: 'nearest' });
    });
  }, []);

  useEffect(() => {
    const form = formScrollRef.current;
    if (!form) return;
    form.addEventListener('focusin', handleFocusIn);
    return () => form.removeEventListener('focusin', handleFocusIn);
  }, [handleFocusIn, open]);

  // UX: Constrain dialog height (max-h-[90vh]) so it never fills the viewport;
  // form content scrolls inside. Keeps focus and works on mobile/desktop.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={true}
        className="max-w-md max-h-[85dvh] sm:max-h-[90vh] flex flex-col gap-4 overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editMode ? `Edit ${categoryLabel}` : `Add ${categoryLabel}`}
          </DialogTitle>
        </DialogHeader>

        <form
          ref={formScrollRef}
          onSubmit={onSubmit}
          className="space-y-6 overflow-y-auto min-h-0 flex-1 pl-3 pr-4 focus:outline-none min-w-0 [&_input]:scroll-mt-6 [&_input]:scroll-mb-24 [&_select]:scroll-mt-6 [&_select]:scroll-mb-24 [&_button]:scroll-mt-4 [&_button]:scroll-mb-8"
          noValidate
        >
          {category && (
            <div className="sr-only" aria-hidden>
              <Label htmlFor="seed-category">Category</Label>
              <select
                id="seed-category"
                defaultValue={category}
                tabIndex={-1}
                aria-hidden
                data-testid="seed-category-select"
              >
                <option value="need">Need</option>
                <option value="want">Want</option>
                <option value="savings">Savings</option>
                <option value="repay">Repayment</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="seed-name">Name</Label>
            <Input
              id="seed-name"
              placeholder={namePlaceholder}
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={
                form.formState.errors.name ? 'seed-name-error' : undefined
              }
              data-testid="seed-name-input"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p
                id="seed-name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {(category === 'need' || category === 'want' || category === 'savings' || category === 'repay') && (
            <div className="space-y-2">
              <Label htmlFor="seed-due-date">Due date (optional)</Label>
              <Input
                id="seed-due-date"
                type="date"
                min={paycycle.start_date}
                max={paycycle.end_date}
                aria-label="Due date"
                aria-invalid={!!form.formState.errors.due_date}
                aria-describedby={
                  form.formState.errors.due_date ? 'seed-due-date-error' : undefined
                }
                data-testid="seed-due-date-input"
                {...form.register('due_date')}
              />
              {form.formState.errors.due_date && (
                <p
                  id="seed-due-date-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {form.formState.errors.due_date.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                When the due date has passed, this item is automatically marked as paid.
              </p>
            </div>
          )}

          {category === 'savings' && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30 min-w-0">
              <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                Savings Goal (Optional)
              </h4>
              {pots.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to existing pot</Label>
                  <Controller
                    name="link_pot_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(v) =>
                          field.onChange(v === 'none' ? undefined : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None – create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None – create new</SelectItem>
                          {pots.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(Number(p.current_amount), currency)} / {formatCurrency(Number(p.target_amount), currency)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              {((!form.watch('link_pot_id') || form.watch('link_pot_id') === 'none') || (editMode && !!linkedPot)) && (
                <>
                  <div className="grid grid-cols-2 gap-4 max-[400px]:grid-cols-1">
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="pot-current">Current ({symbol})</Label>
                      <Controller
                        name="pot_current_str"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="pot-current"
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.]/g, '');
                              field.onChange(v);
                            }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label htmlFor="pot-target">Target ({symbol})</Label>
                      <Controller
                        name="pot_target_str"
                        control={form.control}
                        render={({ field }) => (
                          <Input
                            id="pot-target"
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={field.value}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9.]/g, '');
                              field.onChange(v);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pot-target-date">Target date</Label>
                    <Controller
                      name="pot_target_date"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id="pot-target-date"
                          type="date"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name="pot_status"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? 'active'}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              {POT_STATUS_LABELS.active}
                            </SelectItem>
                            <SelectItem value="complete">
                              {POT_STATUS_LABELS.complete}
                            </SelectItem>
                            <SelectItem value="paused">
                              {POT_STATUS_LABELS.paused}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          )}

{category === 'repay' && (
              <div className="space-y-4 rounded-lg border border-border p-4 bg-muted/30 min-w-0">
                <h4 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
                  Debt / Repayment (Optional)
                </h4>
              {repayments.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to existing repayment</Label>
                  <Controller
                    name="link_repayment_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(v) =>
                          field.onChange(v === 'none' ? undefined : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None – create new" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None – create new</SelectItem>
                          {repayments.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name} ({formatCurrency(Number(r.current_balance), currency)} left)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              {((!form.watch('link_repayment_id') || form.watch('link_repayment_id') === 'none') || (editMode && !!linkedRepayment)) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="repayment-current">Current balance ({symbol})</Label>
                    <Controller
                      name="repayment_current_str"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id="repayment-current"
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9.]/g, '');
                            field.onChange(v);
                          }}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repayment-target-date">Target payoff date</Label>
                    <Controller
                      name="repayment_target_date"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          id="repayment-target-date"
                          type="date"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      name="repayment_status"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? 'active'}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              {REPAYMENT_STATUS_LABELS.active}
                            </SelectItem>
                            <SelectItem value="paused">
                              {REPAYMENT_STATUS_LABELS.paused}
                            </SelectItem>
                            <SelectItem value="paid">
                              {REPAYMENT_STATUS_LABELS.paid}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="seed-amount" className="min-w-0 shrink-0">Amount ({symbol})</Label>
              {suggestedAmount != null && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs px-3 py-1.5 shrink-0"
                  onClick={() =>
                    form.setValue('amountStr', suggestedAmount.toFixed(2))
                  }
                >
                  {category === 'repay'
                    ? `Use suggested minimum (${formatCurrency(suggestedAmount, currency)})`
                    : `Use suggested (${formatCurrency(suggestedAmount, currency)})`}
                </Button>
              )}
            </div>
            <div className="relative flex">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-muted-foreground pointer-events-none">
                {symbol}
              </span>
              <Controller
                name="amountStr"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="seed-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-8"
                    aria-invalid={!!form.formState.errors.amountStr}
                    aria-describedby={
                      form.formState.errors.amountStr ? 'seed-amount-error' : undefined
                    }
                    data-testid="seed-amount-input"
                    value={field.value}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '');
                      field.onChange(v);
                    }}
                  />
                )}
              />
            </div>
            {form.formState.errors.amountStr && (
              <p
                id="seed-amount-error"
                className="text-sm text-destructive"
                role="alert"
                data-testid="amount-error-message"
              >
                {form.formState.errors.amountStr.message}
              </p>
            )}
          </div>

          {isCouple && (
            <div className="space-y-3">
              <Label>Payment Source</Label>
<Controller
                    name="payment_source"
                    control={form.control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex flex-col sm:flex-row gap-4"
                        aria-label="Who pays for this expense"
                        data-testid="seed-source-select"
                      >
                    <RadioGroupItem
                      value="me"
                      label={ownerLabel}
                      data-testid="seed-source-me"
                    />
                    <RadioGroupItem
                      value="partner"
                      label={partnerLabel}
                      data-testid="seed-source-partner"
                    />
                    <RadioGroupItem
                      value="joint"
                      label="JOINT"
                      data-testid="seed-source-joint"
                    />
                  </RadioGroup>
                )}
              />
            </div>
          )}

          {paymentSource === 'joint' && isCouple && (
            <>
              <div className="space-y-3">
                <Label>Split Ratio</Label>
                <p className="text-sm text-muted-foreground">
                  {ownerLabel}: {splitRatio}% / {partnerLabel}: {100 - splitRatio}%
                </p>
                <Controller
                  name="split_ratio"
                  control={form.control}
                  render={({ field }) => (
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[field.value ?? 50]}
                      onValueChange={(v) => field.onChange(v[0])}
                      aria-label="Your share of joint bills (percentage)"
                    />
                  )}
                />
                {previewSplit && amount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {ownerLabel}: {formatCurrency(previewSplit.me, currency)} • {partnerLabel}: {formatCurrency(previewSplit.partner, currency)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="seed-uses-joint"
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...form.register('uses_joint_account')}
                  aria-describedby="seed-uses-joint-desc"
                />
                <div>
                  <Label htmlFor="seed-uses-joint" className="cursor-pointer font-normal">
                    Paid from joint account
                  </Label>
                  <p id="seed-uses-joint-desc" className="text-xs text-muted-foreground">
                    Include in joint transfer calculation. Uncheck if you each pay your share from
                    your own accounts.
                  </p>
                </div>
              </div>
            </>
          )}

          {category !== 'savings' && category !== 'repay' && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="seed-recurring"
              className="h-4 w-4 rounded border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...form.register('is_recurring')}
              aria-describedby="seed-recurring-desc"
              data-testid="seed-recurring-checkbox"
            />
            <div>
              <Label htmlFor="seed-recurring" className="cursor-pointer font-normal">
                Recurring
              </Label>
              <p id="seed-recurring-desc" className="text-xs text-muted-foreground">
                Include in next pay cycle
              </p>
            </div>
          </div>
          )}

          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/30 p-3"
              role="alert"
              data-testid="seed-dialog-error"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
              data-testid="submit-seed-form"
            >
              {editMode ? 'Save Changes' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
