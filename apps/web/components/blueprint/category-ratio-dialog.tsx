'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { updateHouseholdPercentages } from '@/lib/actions/household-actions';
import type { Database } from '@/lib/supabase/database.types';

type Household = Database['public']['Tables']['households']['Row'];

interface CategoryRatioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  household: Household;
  onSuccess: () => void;
}

export function CategoryRatioDialog({
  open,
  onOpenChange,
  household,
  onSuccess,
}: CategoryRatioDialogProps) {
  const [needs, setNeeds] = useState(household.needs_percent);
  const [wants, setWants] = useState(household.wants_percent);
  const [savings, setSavings] = useState(household.savings_percent);
  const [repay, setRepay] = useState(household.repay_percent);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNeeds(household.needs_percent);
      setWants(household.wants_percent);
      setSavings(household.savings_percent);
      setRepay(household.repay_percent);
      setError(null);
    }
  }, [open, household]);

  const total = needs + wants + savings + repay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(total - 100) > 0.01) {
      setError('Percentages must total 100%');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await updateHouseholdPercentages(household.id, {
      needs_percent: Math.round(needs),
      wants_percent: Math.round(wants),
      savings_percent: Math.round(savings),
      repay_percent: Math.round(repay),
    });
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    onSuccess();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Category Split</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            Adjust how you allocate your income across categories. Must total 100%.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="needs-pct">Needs (%)</Label>
              <Input
                id="needs-pct"
                type="number"
                min={0}
                max={100}
                value={needs}
                onChange={(e) => setNeeds(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wants-pct">Wants (%)</Label>
              <Input
                id="wants-pct"
                type="number"
                min={0}
                max={100}
                value={wants}
                onChange={(e) => setWants(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="savings-pct">Savings (%)</Label>
              <Input
                id="savings-pct"
                type="number"
                min={0}
                max={100}
                value={savings}
                onChange={(e) => setSavings(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repay-pct">Repayments (%)</Label>
              <Input
                id="repay-pct"
                type="number"
                min={0}
                max={100}
                value={repay}
                onChange={(e) => setRepay(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <p
            className={`text-sm ${Math.abs(total - 100) > 0.01 ? 'text-warning' : 'text-muted-foreground'}`}
          >
            Total: {total}%
          </p>

          {error && (
            <div
              className="rounded-md bg-destructive/10 border border-destructive/30 p-3"
              role="alert"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Math.abs(total - 100) > 0.01}
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
