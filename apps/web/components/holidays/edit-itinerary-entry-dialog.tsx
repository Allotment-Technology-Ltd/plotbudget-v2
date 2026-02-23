'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { z } from 'zod';
import type { ItineraryEntry} from '@repo/supabase';

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

const ENTRY_TYPES = [
  { value: 'travel', label: 'Travel' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  title: z.string().min(1, 'Title is required').max(200),
  entry_type: z.enum(['travel', 'accommodation', 'activity', 'dining', 'other']),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  description: z.string().max(5000).optional(),
  cost_amount: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditItineraryEntryDialogProps {
  entry: ItineraryEntry;
  tripId: string;
}

export function EditItineraryEntryDialog({ entry, tripId }: EditItineraryEntryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: entry.date,
      title: entry.title,
      entry_type: entry.entry_type as FormData['entry_type'],
      start_time: entry.start_time ?? '',
      end_time: entry.end_time ?? '',
      description: entry.description ?? '',
      cost_amount: entry.cost_amount?.toString() ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        date: entry.date,
        title: entry.title,
        entry_type: entry.entry_type as FormData['entry_type'],
        start_time: entry.start_time ?? '',
        end_time: entry.end_time ?? '',
        description: entry.description ?? '',
        cost_amount: entry.cost_amount?.toString() ?? '',
      });
    }
  }, [open, entry, form]);

  const entryTypeValue = useWatch({ control: form.control, name: 'entry_type' });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          cost_amount: data.cost_amount ? parseFloat(data.cost_amount) : null,
          description: data.description?.trim() || null,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update itinerary entry' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Itinerary entry updated');
      setOpen(false);
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
        <Button variant="ghost" className="h-8 w-8 p-0">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit itinerary entry</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit itinerary entry</DialogTitle>
          <DialogDescription>Update the itinerary entry details</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...form.register('date')}
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
              placeholder="e.g. Beach relaxation"
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
              value={entryTypeValue}
              onValueChange={(value) => form.setValue('entry_type', value as FormData['entry_type'])}
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
            <Label htmlFor="cost_amount">Cost</Label>
            <Input
              id="cost_amount"
              type="number"
              step="0.01"
              min="0"
              {...form.register('cost_amount')}
              placeholder="0.00"
              className="font-body normal-case"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...form.register('description')}
              placeholder="Optional details"
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
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
