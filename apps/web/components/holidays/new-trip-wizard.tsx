'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip } from '@repo/supabase';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'booked', label: 'Booked' },
];

const TRIP_TYPE_OPTIONS = [
  { value: 'none', label: 'None (blank trip)', description: 'Start with an empty trip' },
  { value: 'beach', label: 'Beach Holiday', description: 'Sun, sea, and relaxation' },
  { value: 'city', label: 'City Break', description: 'Urban exploration and culture' },
  { value: 'skiing', label: 'Skiing Trip', description: 'Winter sports adventure' },
  { value: 'winter-city', label: 'Winter City Break', description: 'Festive city experience' },
  { value: 'camping', label: 'Camping Trip', description: 'Outdoor adventure' },
  { value: 'business', label: 'Business Travel', description: 'Work trip essentials' },
];

type WizardStep = 'greeting' | 'basics' | 'details' | 'celebration';

export function NewTripWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('greeting');
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripType, setTripType] = useState('none');
  const [status, setStatus] = useState('planning');
  const [currency, setCurrency] = useState('GBP');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step validation
  const canProceedFromBasics = name.trim() && destination.trim() && startDate && endDate && endDate >= startDate;

  async function handleCreateTrip() {
    if (!canProceedFromBasics) {
      toast.error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
          status,
          currency,
          notes: notes.trim() || null,
          trip_type: tripType === 'none' ? null : tripType,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'Failed to create trip. Please try again.');
        return;
      }
      const trip = (await res.json()) as Trip;
      setCreatedTripId(trip.id);
      setStep('celebration');
    } catch {
      toast.error('Failed to create trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNavigateToTrip() {
    if (createdTripId) {
      router.push(`/dashboard/holidays/${createdTripId}`);
    }
  }

  // Greeting Step
  if (step === 'greeting') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6" data-testid="trip-wizard-greeting">
        <div className="space-y-3">
          <h1 className="font-heading text-3xl uppercase tracking-widest text-foreground">
            Let&apos;s plan your trip
          </h1>
          <p className="text-lg text-muted-foreground">
            This takes about 5 minutes. You can stop and come back anytime.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 space-y-4 text-left">
          <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
            What we&apos;ll do
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Set up your trip basics (name, dates, destination)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Choose a trip type for template suggestions (optional)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Add any extra details you want</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={() => setStep('basics')}
          className="gap-2"
        >
          Get started
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );
  }

  // Basics Step
  if (step === 'basics') {
    return (
      <div className="max-w-xl mx-auto space-y-6" data-testid="trip-wizard-basics">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">
              Trip basics
            </h2>
            <span className="text-sm text-muted-foreground">Step 1 of 2</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tell us about your trip — start with the essentials.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wizard-trip-name">Trip name *</Label>
            <Input
              id="wizard-trip-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer holiday 2026"
              maxLength={200}
              autoFocus
              className="font-body normal-case"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wizard-trip-destination">Destination *</Label>
            <Input
              id="wizard-trip-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Barcelona, Spain"
              maxLength={200}
              className="font-body normal-case"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-trip-start-date">Start date *</Label>
              <Input
                id="wizard-trip-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="font-body normal-case"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-trip-end-date">End date *</Label>
              <Input
                id="wizard-trip-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="font-body normal-case"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('greeting')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button
            onClick={() => setStep('details')}
            disabled={!canProceedFromBasics}
            className="gap-2"
          >
            Continue
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Details Step
  if (step === 'details') {
    return (
      <div className="max-w-xl mx-auto space-y-6" data-testid="trip-wizard-details">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">
              Trip details
            </h2>
            <span className="text-sm text-muted-foreground">Step 2 of 2</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose a trip type to get helpful templates, or leave it blank.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wizard-trip-type">Trip type</Label>
            <Select value={tripType} onValueChange={setTripType}>
              <SelectTrigger id="wizard-trip-type" className="h-10 w-full">
                <SelectValue placeholder="Select a trip type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {TRIP_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tripType && (
              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" aria-hidden />
                <span>
                  Templates will be applied automatically for itinerary, budget, and packing list. You can customize
                  or remove items after creation.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-trip-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="wizard-trip-status" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-trip-currency">Currency</Label>
              <Input
                id="wizard-trip-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="GBP"
                maxLength={10}
                className="font-body normal-case"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wizard-trip-notes">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              id="wizard-trip-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details about the trip…"
              rows={3}
              maxLength={5000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('basics')}
            disabled={submitting}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back
          </Button>
          <Button
            onClick={handleCreateTrip}
            disabled={submitting || !canProceedFromBasics}
            className="gap-2"
          >
            {submitting ? 'Creating…' : 'Create trip'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Celebration Step
  if (step === 'celebration') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6" data-testid="trip-wizard-celebration">
        <div className="space-y-4">
          <div className="text-6xl" role="img" aria-label="Celebration">
            🎉
          </div>
          <h1 className="font-heading text-3xl uppercase tracking-widest text-foreground">
            Your trip is ready!
          </h1>
          <p className="text-lg text-muted-foreground">
            {tripType
              ? 'Templates have been applied — customize them as needed.'
              : 'You can now add itinerary entries, budget items, and packing list items.'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 space-y-4 text-left">
          <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
            What&apos;s next
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Review and customize your itinerary</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Add or adjust budget items</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 text-green-600" aria-hidden />
              <span>Review and update your packing list</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleNavigateToTrip}
          className="gap-2"
        >
          View your trip
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );
  }

  return null;
}
