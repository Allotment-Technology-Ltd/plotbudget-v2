'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Trip, ItineraryEntry, TripBudgetItem, PackingItem } from '@repo/supabase';
import type {
  CreateTripInput,
  UpdateTripInput,
  CreateItineraryEntryInput,
  UpdateItineraryEntryInput,
  CreateTripBudgetItemInput,
  UpdateTripBudgetItemInput,
  CreatePackingItemInput,
  UpdatePackingItemInput,
} from '@repo/logic';

// ─── Trips ────────────────────────────────────────────────────────────────────

export function useTrips(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['trips', filters ?? {}],
    queryFn: async () => {
      const params = filters?.status ? `?status=${encodeURIComponent(filters.status)}` : '';
      const res = await fetch(`/api/trips${params}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trip[]>;
    },
    staleTime: 60_000,
  });
}

export function useTrip(id: string | null) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trip>;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trip>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTripInput) => {
      const res = await fetch(`/api/trips/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Trip>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.invalidateQueries({ queryKey: ['trip', data.id] });
    },
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      qc.removeQueries({ queryKey: ['trip', id] });
      qc.removeQueries({ queryKey: ['trip-itinerary', id] });
      qc.removeQueries({ queryKey: ['trip-budget', id] });
      qc.removeQueries({ queryKey: ['trip-packing', id] });
    },
  });
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

export function useTripItinerary(tripId: string | null) {
  return useQuery({
    queryKey: ['trip-itinerary', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/itinerary`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ItineraryEntry[]>;
    },
    enabled: !!tripId,
    staleTime: 60_000,
  });
}

export function useCreateItineraryEntry(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreateItineraryEntryInput, 'trip_id'>) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, trip_id: tripId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ItineraryEntry>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-itinerary', tripId] }),
  });
}

export function useUpdateItineraryEntry(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateItineraryEntryInput) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<ItineraryEntry>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-itinerary', tripId] }),
  });
}

export function useDeleteItineraryEntry(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${entryId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-itinerary', tripId] }),
  });
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export function useTripBudget(tripId: string | null) {
  return useQuery({
    queryKey: ['trip-budget', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/budget`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<TripBudgetItem[]>;
    },
    enabled: !!tripId,
    staleTime: 60_000,
  });
}

export function useCreateBudgetItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreateTripBudgetItemInput, 'trip_id'>) => {
      const res = await fetch(`/api/trips/${tripId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, trip_id: tripId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<TripBudgetItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-budget', tripId] }),
  });
}

export function useUpdateBudgetItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTripBudgetItemInput) => {
      const res = await fetch(`/api/trips/${tripId}/budget/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<TripBudgetItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-budget', tripId] }),
  });
}

export function useDeleteBudgetItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/trips/${tripId}/budget/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-budget', tripId] }),
  });
}

// ─── Packing ──────────────────────────────────────────────────────────────────

export function useTripPacking(tripId: string | null) {
  return useQuery({
    queryKey: ['trip-packing', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/packing`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PackingItem[]>;
    },
    enabled: !!tripId,
    staleTime: 60_000,
  });
}

export function useCreatePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreatePackingItemInput, 'trip_id'>) => {
      const res = await fetch(`/api/trips/${tripId}/packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, trip_id: tripId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PackingItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-packing', tripId] }),
  });
}

export function useApplyPackingTemplate(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/api/trips/${tripId}/packing?template=${encodeURIComponent(templateId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PackingItem[]>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-packing', tripId] }),
  });
}

export function useTogglePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_packed }: { id: string; is_packed: boolean }) => {
      const res = await fetch(`/api/trips/${tripId}/packing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_packed }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PackingItem>;
    },
    // Optimistic update: flip is_packed immediately (Time Respect)
    onMutate: async ({ id, is_packed }) => {
      await qc.cancelQueries({ queryKey: ['trip-packing', tripId] });
      const previous = qc.getQueryData<PackingItem[]>(['trip-packing', tripId]);
      qc.setQueryData<PackingItem[]>(['trip-packing', tripId], (old) =>
        old?.map((item) => (item.id === id ? { ...item, is_packed } : item)) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['trip-packing', tripId], ctx.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['trip-packing', tripId] }),
  });
}

export function useUpdatePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePackingItemInput) => {
      const res = await fetch(`/api/trips/${tripId}/packing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PackingItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-packing', tripId] }),
  });
}

export function useDeletePackingItem(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/trips/${tripId}/packing/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip-packing', tripId] }),
  });
}
