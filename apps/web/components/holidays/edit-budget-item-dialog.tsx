'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { z } from 'zod';
import type { TripBudgetItem } from '@repo/supabase';

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

const CATEGORIES = [
  { value: 'flights', label: 'Flights' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'car_rental', label: 'Car rental' },
  { value: 'activities', label: 'Activities' },
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
  category: z.enum(['flights', 'accommodation', 'car_rental', 'activities', 'food', 'transport', 'other']),
  name: z.string().min(1, 'Name is required').max(200),
  planned_amount: z.string().optional(),
  actual_amount: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditBudgetItemDialogProps {
  item: TripBudgetItem;
  tripId: string;
}

export function EditBudgetItemDialog({ item, tripId }: EditBudgetItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: item.category as any,
      name: item.name,
      planned_amount: item.planned_amount?.toString() ?? '',
      actual_amount: item.actual_amount?.toString() ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category: item.category as any,
        name: item.name,
        planned_amount: item.planned_amount?.toString() ?? '',
        actual_amount: item.actual_amount?.toString() ?? '',
      });
    }
  }, [open, item, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${tripId}/budget/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          planned_amount: data.planned_amount ? parseFloat(data.planned_amount) : null,
          actual_amount: data.actual_amount ? parseFloat(data.actual_amount) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update budget item' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Budget item updated');
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
          <span className="sr-only">Edit budget item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit budget item</DialogTitle>
          <DialogDescription>Update the budget item details</DialogDescription>
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
            <Label htmlFor="name">Item name *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="planned_amount">Planned amount</Label>
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
            <Label htmlFor="actual_amount">Actual amount</Label>
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
