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
  { value: 'clothing', label: 'Clothing' },
  { value: 'toiletries', label: 'Toiletries' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'medication', label: 'Medication' },
  { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
  category: z.enum(['clothing', 'toiletries', 'electronics', 'documents', 'medication', 'other']),
  name: z.string().min(1, 'Name is required').max(200),
  quantity: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddPackingDialogProps {
  trip: Trip;
}

export function AddPackingDialog({ trip }: AddPackingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'other',
      name: '',
      quantity: '1',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${trip.id}/packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          quantity: data.quantity ? parseInt(data.quantity) : 1,
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to add packing item' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Packing item added');
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
          <DialogTitle>Add packing item</DialogTitle>
          <DialogDescription>Add a new item to your packing list</DialogDescription>
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
              placeholder="e.g. Passport"
              maxLength={200}
              className="font-body normal-case"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...form.register('quantity')}
              placeholder="1"
              className="font-body normal-case"
            />
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
