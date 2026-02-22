'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Recipe, MealPlanEntry, GroceryItem, PantryItem } from '@repo/supabase';
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateMealPlanEntryInput,
  UpdateMealPlanEntryInput,
  CreateGroceryItemInput,
  UpdateGroceryItemInput,
  CreatePantryItemInput,
  UpdatePantryItemInput,
} from '@repo/logic';
import type { PantryAdvisoryMatch } from '@repo/logic';

/** Response from POST /api/recipes/from-url */
export type ImportRecipeFromUrlResponse = {
  recipe: CreateRecipeInput & { source_url?: string };
  image_url?: string;
  instructions?: string;
  prep_mins?: number;
  cook_mins?: number;
};

export type MealPlanFilters = { from?: string; to?: string; limit?: number };

function buildMealPlanQuery(filters?: MealPlanFilters) {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.limit) params.set('limit', String(filters.limit));
  const q = params.toString();
  return `/api/meal-plan${q ? `?${q}` : ''}`;
}

export type MealPlanEntryWithRecipe = MealPlanEntry & { recipe: Recipe | null };

export type RecipesQuery = { limit?: number; q?: string };

export function useRecipes(options?: number | RecipesQuery) {
  const params = typeof options === 'number' ? { limit: options } : options ?? {};
  const { limit, q } = params;
  return useQuery({
    queryKey: ['recipes', limit, q ?? ''],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.set('limit', String(limit));
      if (q?.trim()) searchParams.set('q', q.trim());
      const url = `/api/recipes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Recipe[]>;
    },
  });
}

export function useRecipe(id: string | null) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Recipe>;
    },
    enabled: !!id,
  });
}

/** Response from GET /api/recipes/suggest-external */
export type SuggestExternalResponse = {
  suggestions: Array<{
    id: number | string;
    title: string;
    image: string | null;
    usedIngredientCount: number;
    missedIngredientCount: number;
    sourceUrl: string;
  }>;
  externalEnabled: boolean;
  /** Set when external is enabled so the UI can show provider attribution. */
  externalProvider?: 'spoonacular' | 'reciperadar';
};

export type SuggestExternalFilters = {
  diet?: string;
  intolerances?: string[];
  number?: number;
  type?: string;
  maxReadyTime?: number;
};

export function useSuggestExternal(ingredients: string[], filters?: SuggestExternalFilters) {
  const key = ingredients.length ? ingredients.slice().sort().join(',') : '';
  const diet = filters?.diet ?? '';
  const intolerances = (filters?.intolerances ?? []).slice().sort().join(',');
  const number = filters?.number ?? 5;
  const type = filters?.type ?? '';
  const maxReadyTime = filters?.maxReadyTime ?? undefined;
  return useQuery({
    queryKey: ['suggest-external', key, diet, intolerances, number, type, maxReadyTime],
    queryFn: async () => {
      const params = new URLSearchParams({ ingredients: ingredients.join(',') });
      if (filters?.diet) params.set('diet', filters.diet);
      if (filters?.intolerances?.length) params.set('intolerances', filters.intolerances.join(','));
      if (filters?.number != null) params.set('number', String(filters.number));
      if (filters?.type) params.set('type', filters.type);
      if (filters?.maxReadyTime != null) params.set('maxReadyTime', String(filters.maxReadyTime));
      const res = await fetch(`/api/recipes/suggest-external?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        let message = text;
        try {
          const body = JSON.parse(text) as { message?: string };
          if (typeof body.message === 'string') message = body.message;
        } catch {
          /* use text as message */
        }
        throw new Error(message);
      }
      return res.json() as Promise<SuggestExternalResponse>;
    },
    enabled: ingredients.length > 0,
  });
}

export function useMealPlan(filters?: MealPlanFilters) {
  return useQuery({
    queryKey: ['meal-plan', filters ?? {}],
    queryFn: async () => {
      const res = await fetch(buildMealPlanQuery(filters));
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<MealPlanEntryWithRecipe[]>;
    },
  });
}

export function useMealPlanEntry(id: string | null) {
  return useQuery({
    queryKey: ['meal-plan-entry', id],
    queryFn: async () => {
      const res = await fetch(`/api/meal-plan/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<MealPlanEntryWithRecipe>;
    },
    enabled: !!id,
  });
}

export function useGroceryList(checked?: boolean) {
  return useQuery({
    queryKey: ['grocery', checked],
    queryFn: async () => {
      const params = checked !== undefined ? `?checked=${checked}` : '';
      const res = await fetch(`/api/grocery${params}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GroceryItem[]>;
    },
  });
}

export function useImportRecipeFromUrl() {
  return useMutation({
    mutationFn: async (url: string): Promise<ImportRecipeFromUrlResponse> => {
      const res = await fetch('/api/recipes/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<ImportRecipeFromUrlResponse>;
    },
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRecipeInput) => {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Recipe>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateRecipeInput) => {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Recipe>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipe', data.id] });
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.removeQueries({ queryKey: ['recipe', id] });
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
    },
  });
}

export function useCreateMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMealPlanEntryInput) => {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<MealPlanEntryWithRecipe>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan'] }),
  });
}

export function useUpdateMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMealPlanEntryInput) => {
      const res = await fetch(`/api/meal-plan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<MealPlanEntryWithRecipe>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
      qc.invalidateQueries({ queryKey: ['meal-plan-entry', data.id] });
    },
  });
}

export function useDeleteMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/meal-plan/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan'] }),
  });
}

export function useGenerateGroceryFromMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body?: { from?: string; to?: string; create_shopping_task?: boolean }) => {
      const res = await fetch('/api/meal-plan/generate-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ created: number; grocery_item_ids: string[]; task_id: string | null }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grocery'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroceryItemInput) => {
      const res = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GroceryItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery'] }),
  });
}

export function useUpdateGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateGroceryItemInput) => {
      const res = await fetch(`/api/grocery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<GroceryItem>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['grocery'] });
      qc.invalidateQueries({ queryKey: ['grocery-item', data.id] });
    },
  });
}

export function useDeleteGroceryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/grocery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery'] }),
  });
}

// Pantry
export type PantryListFilters = { location?: string };

export function usePantryList(filters?: PantryListFilters) {
  const location = filters?.location;
  return useQuery({
    queryKey: ['pantry', location ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      const res = await fetch(`/api/pantry${params.toString() ? `?${params.toString()}` : ''}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PantryItem[]>;
    },
  });
}

export type PantryMatchInput =
  | { recipeId: string; entryServings?: number; recipeServings?: number }
  | { ingredients: Array<{ name: string; quantity?: string }>; entryServings?: number; recipeServings?: number };

export type PantryMatchResponse = { matches: PantryAdvisoryMatch[] };

export function usePantryMatch(input: PantryMatchInput | null) {
  const key = input == null ? null : 'recipeId' in input ? input.recipeId : JSON.stringify(input.ingredients);
  return useQuery({
    queryKey: ['pantry-match', key, input?.entryServings ?? 1, input?.recipeServings ?? 1],
    queryFn: async (): Promise<PantryMatchResponse> => {
      if (!input) return { matches: [] };
      const body: Record<string, unknown> = {
        entryServings: ('recipeId' in input ? input.entryServings : input.entryServings) ?? 1,
        recipeServings: ('recipeId' in input ? input.recipeServings : input.recipeServings) ?? 1,
      };
      if ('recipeId' in input) body.recipeId = input.recipeId;
      else body.ingredients = input.ingredients;
      const res = await fetch('/api/pantry/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PantryMatchResponse>;
    },
    enabled: key != null && input != null && (('recipeId' in input && !!input.recipeId) || ('ingredients' in input && input.ingredients.length > 0)),
  });
}

export function useCreatePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePantryItemInput) => {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PantryItem>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });
}

export function useUpdatePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdatePantryItemInput) => {
      const res = await fetch(`/api/pantry/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<PantryItem>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['pantry'] });
      qc.invalidateQueries({ queryKey: ['pantry-item', data.id] });
    },
  });
}

export function useDeletePantryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pantry/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });
}

export function useMarkMealPlanEntryCooked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/meal-plan/${entryId}/mark-cooked`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<{ cooked_at: string; pantry_updated: number }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
      qc.invalidateQueries({ queryKey: ['pantry'] });
    },
  });
}

// Meal plan settings (week start day)
export type MealPlanSettings = { week_start_day: number };

export function useMealPlanSettings() {
  return useQuery({
    queryKey: ['meals-settings'],
    queryFn: async (): Promise<MealPlanSettings> => {
      const res = await fetch('/api/meals/settings');
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<MealPlanSettings>;
    },
  });
}

export type BarcodeLookupResult = {
  found: boolean;
  name: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
};

export function useBarcodeLookup() {
  return useMutation({
    mutationFn: async (barcode: string): Promise<BarcodeLookupResult> => {
      const trimmed = barcode.trim();
      if (!trimmed) throw new Error('Barcode required');
      const res = await fetch(`/api/meals/barcode-lookup?barcode=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<BarcodeLookupResult>;
    },
  });
}

export function useUpdateMealPlanSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { week_start_day: number }) => {
      const res = await fetch('/api/meals/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? res.statusText);
      }
      return res.json() as Promise<MealPlanSettings>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meals-settings'] });
      qc.invalidateQueries({ queryKey: ['meal-plan'] });
    },
  });
}
