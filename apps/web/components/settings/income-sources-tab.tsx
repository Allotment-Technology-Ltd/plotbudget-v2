'use client';

import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatIncomeSourceDisplayName } from '@/lib/utils/display-name';
import { currencySymbol } from '@/lib/utils/currency';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  createIncomeSource,
  deleteIncomeSource,
  updateIncomeSource,
  type FrequencyRule,
  type PaymentSource,
} from '@/lib/actions/income-source-actions';
import type { IncomeSource } from '@/lib/supabase/database.types';

const FREQUENCY_LABELS: Record<FrequencyRule, string> = {
  specific_date: 'Specific date (e.g. 25th)',
  last_working_day: 'Last working day of month',
  every_4_weeks: 'Every 4 weeks',
};

/** Labels for payment source (couple households use owner/partner names). */
function getPaymentSourceLabels(
  ownerLabel: string,
  partnerLabel: string
): Record<PaymentSource, string> {
  return {
    me: ownerLabel,
    partner: partnerLabel,
    joint: 'JOINT',
  };
}

interface IncomeSourcesTabProps {
  householdId: string;
  incomeSources: IncomeSource[];
  isPartner?: boolean;
  ownerLabel?: string;
  partnerLabel?: string;
  currency?: 'GBP' | 'USD' | 'EUR';
}

type FormState = {
  name: string;
  amount: string;
  frequency_rule: FrequencyRule;
  day_of_month: string;
  anchor_date: string;
  payment_source: PaymentSource;
};

const emptyForm: FormState = {
  name: '',
  amount: '',
  frequency_rule: 'specific_date',
  day_of_month: '1',
  anchor_date: '',
  payment_source: 'me',
};

function sourceToForm(s: IncomeSource): FormState {
  return {
    name: s.name,
    amount: String(s.amount ?? 0),
    frequency_rule: s.frequency_rule,
    day_of_month: s.day_of_month != null ? String(s.day_of_month) : '1',
    anchor_date: s.anchor_date ?? '',
    payment_source: s.payment_source,
  };
}

export function IncomeSourcesTab({
  householdId,
  incomeSources,
  isPartner = false,
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
  currency = 'GBP',
}: IncomeSourcesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openAdd = () => {
    setEditingId(null);
    setForm(isPartner ? { ...emptyForm, payment_source: 'partner' } : emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (source: IncomeSource) => {
    setEditingId(source.id);
    setForm(sourceToForm(source));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const day = form.frequency_rule === 'specific_date' ? parseInt(form.day_of_month, 10) : null;
    if (form.frequency_rule === 'specific_date' && (day == null || day < 1 || day > 31)) {
      toast.error('Day of month must be 1–31');
      return;
    }
    if (form.frequency_rule === 'every_4_weeks' && !form.anchor_date.trim()) {
      toast.error('Please set the first pay date for every-4-weeks');
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        const res = await updateIncomeSource(editingId, {
          name: form.name.trim(),
          amount,
          frequency_rule: form.frequency_rule,
          day_of_month: form.frequency_rule === 'specific_date' ? day : null,
          anchor_date:
            form.frequency_rule === 'every_4_weeks' ? form.anchor_date.trim() || null : null,
          payment_source: form.payment_source,
        });
        if (res.error) throw new Error(res.error);
        toast.success('Income source updated');
      } else {
        const res = await createIncomeSource({
          household_id: householdId,
          name: form.name.trim(),
          amount,
          frequency_rule: form.frequency_rule,
          day_of_month: form.frequency_rule === 'specific_date' ? day ?? 1 : null,
          anchor_date:
            form.frequency_rule === 'every_4_weeks' ? form.anchor_date.trim() || null : null,
          payment_source: form.payment_source,
        });
        if (res.error) throw new Error(res.error);
        toast.success('Income source added');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteIncomeSource(deleteId);
      if (res.error) throw new Error(res.error);
      toast.success('Income source removed');
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleActive = async (source: IncomeSource) => {
    try {
      const res = await updateIncomeSource(source.id, { is_active: !source.is_active });
      if (res.error) throw new Error(res.error);
      toast.success(source.is_active ? 'Income source paused' : 'Income source enabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const frequencySubline = (s: IncomeSource) => {
    if (s.frequency_rule === 'specific_date' && s.day_of_month != null) {
      return `Day ${s.day_of_month} of month`;
    }
    if (s.frequency_rule === 'last_working_day') return 'Last working day';
    if (s.frequency_rule === 'every_4_weeks' && s.anchor_date) {
      return `Every 4 weeks from ${s.anchor_date}`;
    }
    return FREQUENCY_LABELS[s.frequency_rule];
  };

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
              Income sources
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add pay dates and amounts. Used when creating the next budget cycle so income is
              projected correctly (including 4‑weekly double‑dip).
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" onClick={openAdd}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Add income source
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-lg border-border max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit income source' : 'Add income source'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="income-name">Name</Label>
                    <Input
                      id="income-name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. My salary"
                      maxLength={100}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-amount">Amount ({currencySymbol(currency)})</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                      placeholder="0"
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-frequency">Frequency</Label>
                    <Select
                      value={form.frequency_rule}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, frequency_rule: v as FrequencyRule }))
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger id="income-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(FREQUENCY_LABELS) as FrequencyRule[]).map((k) => (
                          <SelectItem key={k} value={k}>
                            {FREQUENCY_LABELS[k]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.frequency_rule === 'specific_date' && (
                    <div className="space-y-2">
                      <Label htmlFor="income-day">Day of month (1–31)</Label>
                      <Input
                        id="income-day"
                        type="number"
                        min={1}
                        max={31}
                        value={form.day_of_month}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, day_of_month: e.target.value }))
                        }
                        disabled={isSaving}
                      />
                    </div>
                  )}
                  {form.frequency_rule === 'every_4_weeks' && (
                    <div className="space-y-2">
                      <Label htmlFor="income-anchor">First pay date</Label>
                      <Input
                        id="income-anchor"
                        type="date"
                        value={form.anchor_date}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, anchor_date: e.target.value }))
                        }
                        required
                        disabled={isSaving}
                      />
                      <p className="text-xs text-muted-foreground">
                        Next payments are 28 days after this date.
                      </p>
                    </div>
                  )}
                  {!isPartner && (
                    <div className="space-y-2">
                      <Label htmlFor="income-source">Who gets this income</Label>
                      <Select
                        value={form.payment_source}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, payment_source: v as PaymentSource }))
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger id="income-source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(getPaymentSourceLabels(ownerLabel, partnerLabel)) as PaymentSource[]).map((k) => (
                            <SelectItem key={k} value={k}>
                              {getPaymentSourceLabels(ownerLabel, partnerLabel)[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      )}
                      {editingId ? 'Save' : 'Add'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>

        {incomeSources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No income sources yet. Create your next budget cycle will use your current cycle&apos;s
            income. Add sources above to project income from pay dates (e.g. 4‑weekly or different
            pay days).
          </p>
        ) : (
          <ul className="space-y-3" role="list">
            {incomeSources.map((source) => (
              <li
                key={source.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {formatIncomeSourceDisplayName(
                        source.name,
                        source.payment_source,
                        ownerLabel,
                        partnerLabel
                      )}
                    </span>
                    {!source.is_active && (
                      <Badge variant="secondary">Paused</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currencySymbol(currency)}{Number(source.amount).toLocaleString('en-GB')} · {frequencySubline(source)} ·{' '}
                    {getPaymentSourceLabels(ownerLabel, partnerLabel)[source.payment_source]}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={source.is_active}
                      onCheckedChange={() => toggleActive(source)}
                      aria-label={source.is_active ? 'Pause source' : 'Enable source'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 p-0 shrink-0"
                      onClick={() => openEdit(source)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 w-9 p-0 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(source.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove income source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the income source. Future budget cycles will no longer include it in
              projected income. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
