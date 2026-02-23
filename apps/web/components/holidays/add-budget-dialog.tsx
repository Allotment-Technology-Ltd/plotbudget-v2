'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { z } from 'zod';
import type { Trip } from '@repo/supabase';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const MODULE_COLOR = '#8B5CF6';

const CATEGORIES = [
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'flights', label: 'Flights' },
  { value: 'transport', label: 'Transport' },
  { value: 'food', label: 'Food' },
  { value: 'activities', label: 'Activities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
  category: z.enum(['accommodation', 'flights', 'transport', 'food', 'activities', 'shopping', 'other']),
  name: z.string().min(1, 'Name is required').max(200),
  planned_amount: z.string().optional(),
  actual_amount: z.string().optional(),
  itinerary_entry_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddBudgetDialogProps {
  trip: Trip;
}

export function AddBudgetDialog({ trip }: AddBudgetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'other',
      name: '',
      planned_amount: '',
      actual_amount: '',
      itinerary_entry_id: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${trip.id}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          planned_amount: data.planned_amount ? parseFloat(data.planned_amount) : null,
          itinerary_entry_id: data.itinerary_entry_id || null,
          actual_amount: data.actual_amount ? parseFloat(data.actual_amount) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to add budget item' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Budget item added');
      setOpen(false);
      form.reset();
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-1.5 h-9 px-3 text-sm"
          style={{ color: MODULE_COLOR, borderColor: MODULE_COLOR }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add budget item</DialogTitle>
          <DialogDescription>
            Add a new item to your trip budget. Tip: When adding itinerary entries with costs, check "Also add to budget" to automatically create linked budget items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value) => form.setValue('category', value as any)}
            >
              <SelectTrigger id="category" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="e.g. Hotel booking"
              maxLength={200}
              className="font-body normal-case"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planned_amount">Planned ({trip.currency})</Label>
              <Input
                id="planned_amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register('planned_amount')}
                placeholder="0.00"
                className="font-body normal-case"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_amount">Actual ({trip.currency})</Label>
              <Input
                id="actual_amount"
                type="number"
                step="0.01"
                min="0"
                {...form.register('actual_amount')}
                placeholder="0.00"
                className="font-body normal-case"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding…' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
