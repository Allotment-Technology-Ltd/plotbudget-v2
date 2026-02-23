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
import { toast } from 'sonner';
import type { Trip } from '@repo/supabase';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'planning', label: 'Planning' },
  { value: 'booked', label: 'Booked' },
];

export function NewTripForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [currency, setCurrency] = useState('GBP');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Trip name is required.'); return; }
    if (!destination.trim()) { toast.error('Destination is required.'); return; }
    if (!startDate) { toast.error('Start date is required.'); return; }
    if (!endDate) { toast.error('End date is required.'); return; }
    if (endDate < startDate) { toast.error('End date must not be before start date.'); return; }

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
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? 'Failed to create trip. Please try again.');
        return;
      }
      const trip = (await res.json()) as Trip;
      router.push(`/dashboard/holidays/${trip.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl" data-testid="new-trip-form">
      <div className="space-y-2">
        <Label htmlFor="trip-name">Trip name *</Label>
        <Input
          id="trip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer holiday 2025"
          maxLength={200}
          required
          className="font-body normal-case"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trip-destination">Destination *</Label>
        <Input
          id="trip-destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Barcelona, Spain"
          maxLength={200}
          required
          className="font-body normal-case"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trip-start-date">Start date *</Label>
          <Input
            id="trip-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="font-body normal-case"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trip-end-date">End date *</Label>
          <Input
            id="trip-end-date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="font-body normal-case"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trip-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="trip-status" className="h-9 w-full pl-3 pr-8 text-sm">
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
          <Label htmlFor="trip-currency">Currency</Label>
          <Input
            id="trip-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="GBP"
            maxLength={10}
            className="font-body normal-case"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trip-notes">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <textarea
          id="trip-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any extra details about the trip…"
          rows={3}
          maxLength={5000}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create trip'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
