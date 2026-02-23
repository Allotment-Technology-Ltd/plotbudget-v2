'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Loader2 } from 'lucide-react';
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

// Match the template IDs from packing-templates.ts
const TEMPLATES = [
  { id: 'beach', name: 'Beach Holiday', description: 'Swimwear, sunscreen, beach gear' },
  { id: 'city', name: 'City Break', description: 'Walking shoes, day pack, city essentials' },
  { id: 'skiing', name: 'Skiing Trip', description: 'Winter gear, ski equipment, thermals' },
  { id: 'winter-city', name: 'Winter City Break', description: 'Warm clothes, winter accessories' },
  { id: 'camping', name: 'Camping Trip', description: 'Tent, sleeping bag, outdoor gear' },
  { id: 'business', name: 'Business Travel', description: 'Professional attire, electronics, documents' },
];

interface PackingTemplateDialogProps {
  trip: Trip;
}

export function PackingTemplateDialog({ trip }: PackingTemplateDialogProps) {
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
      const response = await fetch(`/api/trips/${trip.id}/packing?template=${selectedTemplate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to load template');
      }

      toast.success('Packing template loaded');
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error loading packing template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Packing Template</DialogTitle>
          <DialogDescription>
            Select a pre-populated packing list for your trip type. You can edit items after adding them.
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
