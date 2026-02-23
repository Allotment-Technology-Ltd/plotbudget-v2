'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteItemButtonProps {
  itemId: string;
  tripId: string;
  itemType: 'packing' | 'itinerary' | 'budget';
  itemName: string;
}

export function DeleteItemButton({ itemId, tripId, itemType, itemName }: DeleteItemButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const typeLabels = {
    packing: 'packing item',
    itinerary: 'itinerary entry',
    budget: 'budget item',
  };

  const typeEndpoints = {
    packing: 'packing',
    itinerary: 'itinerary',
    budget: 'budget',
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const endpoint = itemType === 'itinerary' 
        ? `/api/trips/${tripId}/${typeEndpoints[itemType]}/${itemId}`
        : `/api/trips/${tripId}/${typeEndpoints[itemType]}/${itemId}`;
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: `Failed to delete ${typeLabels[itemType]}` }));
        throw new Error(error.error);
      }
    },
    onSuccess: () => {
      toast.success(`${typeLabels[itemType].charAt(0).toUpperCase() + typeLabels[itemType].slice(1)} deleted`);
      setOpen(false);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete {typeLabels[itemType]}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {typeLabels[itemType]}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
