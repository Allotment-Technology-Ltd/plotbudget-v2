'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import type { Trip } from '@repo/supabase';

// Match the template IDs from budget-templates.ts
const TEMPLATES = [
  { id: 'beach', name: 'Beach Holiday', description: 'Budget for a relaxing beach vacation' },
  { id: 'city', name: 'City Break', description: 'Budget for urban exploration and dining' },
  { id: 'skiing', name: 'Skiing Trip', description: 'Budget for winter sports and equipment' },
  { id: 'winter-city', name: 'Winter City Break', description: 'Budget for winter city activities' },
  { id: 'camping', name: 'Camping Trip', description: 'Budget for outdoor camping adventure' },
  { id: 'business', name: 'Business Travel', description: 'Budget for professional trip expenses' },
];

interface BudgetTemplateDialogProps {
  trip: Trip;
}

export function BudgetTemplateDialog({ trip }: BudgetTemplateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('beach');
  const [isLoading, setIsLoading] = useState(false);

  async function handleUseTemplate() {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/trips/${trip.id}/budget?template=${selectedTemplate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to load template');
      }

      toast.success('Budget template loaded');
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error loading budget template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Banknote className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Budget Template</DialogTitle>
          <DialogDescription>
            Select a pre-configured budget for your trip type. You can adjust amounts after adding them.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <div className="space-y-3">
              {TEMPLATES.map((template) => (
                <div key={template.id} className="flex items-start space-x-3">
                  <RadioGroupItem value={template.id} id={`template-${template.id}`} className="mt-1" />
                  <Label
                    htmlFor={`template-${template.id}`}
                    className="flex-1 cursor-pointer text-sm font-normal leading-tight"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{template.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUseTemplate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
