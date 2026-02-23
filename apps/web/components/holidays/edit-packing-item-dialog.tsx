'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { z } from 'zod';
import type { PackingItem } from '@repo/supabase';

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
  is_packed: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditPackingItemDialogProps {
  item: PackingItem;
  tripId: string;
}

export function EditPackingItemDialog({ item, tripId }: EditPackingItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: item.category as FormData['category'],
      name: item.name,
      is_packed: item.is_packed,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category: item.category as FormData['category'],
        name: item.name,
        is_packed: item.is_packed,
      });
    }
  }, [open, item, form]);

  const categoryValue = useWatch({ control: form.control, name: 'category' });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/trips/${tripId}/packing/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update packing item' }));
        throw new Error(error.error);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Packing item updated');
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
          <span className="sr-only">Edit packing item</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit packing item</DialogTitle>
          <DialogDescription>Update the packing item details</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={categoryValue}
              onValueChange={(value) => form.setValue('category', value as FormData['category'])}
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_packed"
              {...form.register('is_packed')}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_packed" className="font-normal">Packed</Label>
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
