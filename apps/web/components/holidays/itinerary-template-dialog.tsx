'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, Loader2 } from 'lucide-react';
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

// Match the template IDs from itinerary-templates.ts
const TEMPLATES = [
  { id: 'beach', name: 'Beach Holiday', description: '7-day relaxation with beach activities' },
  { id: 'city', name: 'City Break', description: '5-day urban exploration and sightseeing' },
  { id: 'skiing', name: 'Skiing Trip', description: '7-day winter sports adventure' },
  { id: 'winter-city', name: 'Winter City Break', description: '5-day winter city experience' },
  { id: 'camping', name: 'Camping Trip', description: '5-day outdoor adventure' },
  { id: 'business', name: 'Business Travel', description: '5-day professional trip with meetings' },
];

interface ItineraryTemplateDialogProps {
  trip: Trip;
}

export function ItineraryTemplateDialog({ trip }: ItineraryTemplateDialogProps) {
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
      const response = await fetch(`/api/trips/${trip.id}/itinerary?template=${selectedTemplate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? 'Failed to load template');
      }

      toast.success('Itinerary template loaded');
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error loading itinerary template:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5 h-9 px-3 text-sm">
          <List className="h-4 w-4" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Choose Itinerary Template</DialogTitle>
          <DialogDescription>
            Select a pre-planned itinerary for your trip type. Dates will be calculated based on your trip start date.
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
            Add Entries
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
