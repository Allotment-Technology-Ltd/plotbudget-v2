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

const ENTRY_TYPES = [
  { value: 'flight', label: 'Flight' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'activity', label: 'Activity' },
  { value: 'transport', label: 'Transport' },
  { value: 'meal', label: 'Meal' },
  { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required').max(200),
  entry_type: z.enum(['flight', 'accommodation', 'activity', 'transport', 'meal', 'other']),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  description: z.string().max(5000).optional(),
  cost: z.string().optional(),
  create_budget_item: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddItineraryDialogProps {
  trip: Trip;
}

export function AddItineraryDialog({ trip }: AddItineraryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: trip.start_date,
      title: '',
      entry_type: 'activity',
      start_time: '',
      end_time: '',
      description: '',
      cost: '',
      create_budget_item: true,
    },
  });

  const costValue = form.watch('cost');
  const hasCost = costValue && parseFloat(costValue) > 0;

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${trip.id}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cost: data.cost ? parseFloat(data.cost) : null,
          description: data.description?.trim() || null,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to add itinerary entry' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Itinerary entry added');
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
          Add entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add itinerary entry</DialogTitle>
          <DialogDescription>Add a new entry to your trip itinerary</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
              min={trip.start_date}
              max={trip.end_date}
              className="font-body normal-case"
            />
            {form.formState.errors.date && (
              <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="e.g. Morning flight to Barcelona"
              maxLength={200}
              className="font-body normal-case"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry_type">Type *</Label>
            <Select
              value={form.watch('entry_type')}
              onValueChange={(value) => form.setValue('entry_type', value as any)}
            >
              <SelectTrigger id="entry_type" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start time</Label>
              <Input
                id="start_time"
                type="time"
                {...form.register('start_time')}
                className="font-body normal-case"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End time</Label>
              <Input
                id="end_time"
                type="time"
                {...form.register('end_time')}
                className="font-body normal-case"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost ({trip.currency})</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              {...form.register('cost')}
              placeholder="0.00"
              className="font-body normal-case"
            />
          </div>

          {hasCost && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="create_budget_item"
                {...form.register('create_budget_item')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="create_budget_item" className="text-sm font-normal cursor-pointer">
                Also add to budget (creates linked budget item)
              </Label>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...form.register('description')}
              placeholder="Additional details…"
              rows={3}
              maxLength={5000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Adding…' : 'Add entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
