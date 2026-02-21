'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Event } from '@repo/supabase';
import type { CreateEventInput, UpdateEventInput } from '@repo/logic';

export type EventRange = { start: string; end: string };

function buildEventsQuery(range?: EventRange) {
  const params = new URLSearchParams();
  if (range?.start) params.set('start', range.start);
  if (range?.end) params.set('end', range.end);
  const q = params.toString();
  return `/api/events${q ? `?${q}` : ''}`;
}

export function useEvents(range?: EventRange) {
  return useQuery({
    queryKey: ['events', range ?? {}],
    queryFn: async () => {
      // Relative URL only — same-origin request, no SSRF (client-side fetch to our API).
      const res = await fetch(buildEventsQuery(range));
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event[]>;
    },
  });
}

export function useEvent(id: string | null) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event>;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEventInput) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Event>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', data.id] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.removeQueries({ queryKey: ['event', id] });
    },
  });
}
