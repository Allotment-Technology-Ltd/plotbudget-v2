import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { checkSpoonacularRateLimit } from '@/lib/rate-limit';

/** Spoonacular diet parameter values (lowercase). */
const SPOONACULAR_DIETS = [
  'gluten free',
  'ketogenic',
  'vegetarian',
  'lacto-vegetarian',
  'ovo-vegetarian',
  'vegan',
  'pescetarian',
  'paleo',
  'primal',
  'low fodmap',
  'whole30',
] as const;

/** Spoonacular intolerance parameter values (lowercase). */
const SPOONACULAR_INTOLERANCES = [
  'dairy',
  'egg',
  'gluten',
  'grain',
  'peanut',
  'seafood',
  'sesame',
  'shellfish',
  'soy',
  'sulfite',
  'tree nut',
  'wheat',
] as const;

/** Spoonacular meal type parameter values (complexSearch `type`). */
const SPOONACULAR_MEAL_TYPES = [
  'breakfast',
  'main course',
  'snack',
  'soup',
  'salad',
  'side dish',
  'appetizer',
  'dessert',
  'beverage',
  'bread',
  'drink',
  'fingerfood',
  'marinade',
  'sauce',
] as const;

const suggestQuerySchema = z.object({
  ingredients: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean))
    .pipe(z.array(z.string().min(1).max(100)).min(1).max(20)),
  diet: z
    .string()
    .optional()
    .transform((s) => s?.trim().toLowerCase() || undefined)
    .refine((v) => !v || SPOONACULAR_DIETS.includes(v as (typeof SPOONACULAR_DIETS)[number]), {
      message: 'Invalid diet',
    }),
  intolerances: z
    .string()
    .optional()
    .transform((s) =>
      s
        ? s
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter((x) => x && SPOONACULAR_INTOLERANCES.includes(x as (typeof SPOONACULAR_INTOLERANCES)[number]))
        : []
    ),
  number: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : 5))
    .pipe(z.number().int().min(5).max(20)),
  type: z
    .string()
    .optional()
    .transform((s) => s?.trim().toLowerCase() || undefined)
    .refine(
      (v) => !v || SPOONACULAR_MEAL_TYPES.includes(v as (typeof SPOONACULAR_MEAL_TYPES)[number]),
      { message: 'Invalid meal type' }
    ),
  maxReadyTime: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : undefined))
    .pipe(z.number().int().min(5).max(300).optional()),
});

export type SuggestExternalItem = {
  id: string | number;
  title: string;
  image: string | null;
  usedIngredientCount: number;
  missedIngredientCount: number;
  sourceUrl: string;
};

export type SuggestExternalResponse = {
  suggestions: SuggestExternalItem[];
  externalEnabled: boolean;
  /** Set when externalEnabled so the UI can show provider attribution (e.g. "Powered by Spoonacular"). */
  externalProvider?: 'spoonacular' | 'reciperadar';
};

/*
 * RecipeRadar (commented out; app uses Spoonacular only). Uncomment to restore self-hosted option.
 *
 * RecipeRadar API: GET /recipes/search?ingredients[]=x&limit=5
 * function buildRecipeRadarUrl(baseUrl, ingredients, limit) { ... }
 * type RecipeRadarResult = { id?, name?, title?, image?, image_url?, url?, source_url?, ... }
 * function getRecipePageBaseUrl() { from RECIPERADAR_RECIPE_BASE_URL or RECIPERADAR_API_BASE_URL }
 * function mapRecipeRadarToItem(r, ingredientsCount): SuggestExternalItem { ... }
 */

/** Spoonacular API: GET /recipes/findByIngredients (some docs show title, some show name). */
type SpoonacularResult = {
  id: number;
  title?: string;
  name?: string;
  image?: string | null;
  usedIngredientCount?: number;
  missedIngredientCount?: number;
};

/** Spoonacular API: GET /recipes/complexSearch (with fillIngredients). */
type ComplexSearchResult = {
  id: number;
  title?: string;
  name?: string;
  image?: string | null;
  usedIngredientCount?: number;
  missedIngredientCount?: number;
  usedIngredients?: unknown[];
  missedIngredients?: unknown[];
};

function mapSpoonacularToItem(r: SpoonacularResult): SuggestExternalItem {
  const title = (r.title ?? r.name ?? 'Recipe').trim() || 'Recipe';
  const slug = String(title).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const sourceUrl = `https://spoonacular.com/recipes/${slug}-${r.id}`;
  return {
    id: r.id,
    title,
    image: typeof r.image === 'string' ? r.image : null,
    usedIngredientCount: r.usedIngredientCount ?? 0,
    missedIngredientCount: r.missedIngredientCount ?? 0,
    sourceUrl,
  };
}

function mapComplexSearchToItem(r: ComplexSearchResult): SuggestExternalItem {
  const title = (r.title ?? r.name ?? 'Recipe').trim() || 'Recipe';
  const slug = String(title).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const sourceUrl = `https://spoonacular.com/recipes/${slug}-${r.id}`;
  const used = r.usedIngredientCount ?? (Array.isArray(r.usedIngredients) ? r.usedIngredients.length : 0);
  const missed = r.missedIngredientCount ?? (Array.isArray(r.missedIngredients) ? r.missedIngredients.length : 0);
  return {
    id: r.id,
    title,
    image: typeof r.image === 'string' ? r.image : null,
    usedIngredientCount: used,
    missedIngredientCount: missed,
    sourceUrl,
  };
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId)
    return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const { data: userRow } = await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle();
  const isAdmin = (userRow as { is_admin?: boolean } | null)?.is_admin === true;
  const parsed = suggestQuerySchema.safeParse({
    ingredients: searchParams.get('ingredients') ?? '',
    diet: searchParams.get('diet') ?? undefined,
    intolerances: searchParams.get('intolerances') ?? undefined,
    number: searchParams.get('number') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    maxReadyTime: searchParams.get('maxReadyTime') ?? undefined,
  });
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Invalid ingredients or filters', details: parsed.error.flatten() },
      { status: 400 }
    );

  const { ingredients, diet, intolerances, number: resultCount, type: mealType, maxReadyTime } = parsed.data;
  const spoonacularKey = process.env.SPOONACULAR_API_KEY?.trim() ?? '';
  const useDietaryFilters = !!diet || (Array.isArray(intolerances) && intolerances.length > 0);
  const useComplexSearch = useDietaryFilters || !!mealType || maxReadyTime != null;
  const intolerancesStr = Array.isArray(intolerances) ? intolerances.join(',') : '';

  // RecipeRadar branch commented out: app uses Spoonacular only. See git history to restore.
  // const reciperadarRaw = process.env.RECIPERADAR_API_BASE_URL?.trim() ?? '';
  // const reciperadarDisabled = reciperadarRaw === 'off' || reciperadarRaw === 'false';
  // const reciperadarBaseUrl = reciperadarDisabled ? '' : reciperadarRaw.replace(/\/$/, '');
  // if (reciperadarBaseUrl) { ... buildRecipeRadarUrl, fetch, mapRecipeRadarToItem, optional Spoonacular fallback ... }

  if (spoonacularKey) {
    const { allowed } = await checkSpoonacularRateLimit(user.id, isAdmin);
    if (!allowed) {
      return NextResponse.json(
        {
          suggestions: [],
          externalEnabled: true,
          externalProvider: 'spoonacular',
          message: 'Too many recipe searches for today. Try again tomorrow.',
        },
        { status: 429 }
      );
    }

    if (useComplexSearch) {
      const params = new URLSearchParams({
        includeIngredients: ingredients.join(','),
        number: String(resultCount),
        fillIngredients: 'true',
        apiKey: spoonacularKey,
      });
      if (diet) params.set('diet', diet);
      if (intolerancesStr) params.set('intolerances', intolerancesStr);
      if (mealType) params.set('type', mealType);
      if (maxReadyTime != null) params.set('maxReadyTime', String(maxReadyTime));
      const complexUrl = `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;
      const res = await fetch(complexUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Spoonacular complexSearch suggest-external failed:', res.status, text);
        const treatAsDisabled = res.status === 401 || res.status === 403;
        if (res.status === 429) {
          return NextResponse.json<SuggestExternalResponse>(
            { suggestions: [], externalEnabled: true, externalProvider: 'spoonacular' },
            { status: 200 }
          );
        }
        return NextResponse.json<SuggestExternalResponse>(
          { suggestions: [], externalEnabled: !treatAsDisabled },
          { status: 200 }
        );
      }

      let body: { results?: ComplexSearchResult[] };
      try {
        body = await res.json();
      } catch {
        return NextResponse.json<SuggestExternalResponse>(
          { suggestions: [], externalEnabled: true, externalProvider: 'spoonacular' },
          { status: 200 }
        );
      }

      const results = Array.isArray(body?.results) ? body.results : [];
      const suggestions: SuggestExternalItem[] = results.slice(0, resultCount).map(mapComplexSearchToItem);
      return NextResponse.json<SuggestExternalResponse>({
        suggestions,
        externalEnabled: true,
        externalProvider: 'spoonacular',
      });
    }

    const params = new URLSearchParams({
      ingredients: ingredients.join(','),
      number: String(resultCount),
      apiKey: spoonacularKey,
    });
    const spoonacularUrl = `https://api.spoonacular.com/recipes/findByIngredients?${params.toString()}`;
    const res = await fetch(spoonacularUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Spoonacular suggest-external failed:', res.status, text);
      const treatAsDisabled = res.status === 401 || res.status === 403;
      if (res.status === 429) {
        return NextResponse.json<SuggestExternalResponse>(
          { suggestions: [], externalEnabled: true, externalProvider: 'spoonacular' },
          { status: 200 }
        );
      }
      return NextResponse.json<SuggestExternalResponse>(
        { suggestions: [], externalEnabled: !treatAsDisabled },
        { status: 200 }
      );
    }

    let data: SpoonacularResult[];
    try {
      data = await res.json();
    } catch {
      return NextResponse.json<SuggestExternalResponse>(
        { suggestions: [], externalEnabled: true, externalProvider: 'spoonacular' },
        { status: 200 }
      );
    }

    const suggestions: SuggestExternalItem[] = Array.isArray(data)
      ? data.slice(0, resultCount).map(mapSpoonacularToItem)
      : [];
    return NextResponse.json<SuggestExternalResponse>({
      suggestions,
      externalEnabled: true,
      externalProvider: 'spoonacular',
    });
  }

  return NextResponse.json<SuggestExternalResponse>({
    suggestions: [],
    externalEnabled: false,
  });
}
