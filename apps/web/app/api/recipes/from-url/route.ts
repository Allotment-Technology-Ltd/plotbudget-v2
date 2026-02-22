import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import {
  importRecipeFromUrlSchema,
  createRecipeSchema,
  mapScrapedRecipeToImported,
  type ScrapedRecipe,
} from '@repo/logic';
import getRecipeData from '@rethora/url-recipe-scraper';

const FETCH_TIMEOUT_MS = 10_000;
const FETCH_MAX_BYTES = 2 * 1024 * 1024; // 2MB

/** In production, reject localhost and file URLs. */
function isUrlAllowedInProduction(url: string): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = importRecipeFromUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid URL', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { url } = parsed.data;
  if (!isUrlAllowedInProduction(url)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'PLOT Recipe Importer (https://plotbudget.com)' },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch page: ${res.status}` },
        { status: 422 }
      );
    }
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > FETCH_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Page too large to process' },
        { status: 422 }
      );
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > FETCH_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Page too large to process' },
        { status: 422 }
      );
    }
    html = new TextDecoder('utf-8').decode(buf);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Fetch failed';
    return NextResponse.json(
      { error: message.includes('abort') ? 'Request timed out' : message },
      { status: 422 }
    );
  }

  let scraped: ScrapedRecipe;
  try {
    scraped = (await getRecipeData(html)) as ScrapedRecipe;
  } catch {
    return NextResponse.json(
      { error: "Couldn't extract a recipe from this page" },
      { status: 422 }
    );
  }

  if (!scraped?.name && (!scraped?.recipeIngredient || scraped.recipeIngredient.length === 0)) {
    return NextResponse.json(
      { error: "Couldn't extract a recipe from this page" },
      { status: 422 }
    );
  }

  const imported = mapScrapedRecipeToImported(scraped, url);
  const recipeValidation = createRecipeSchema.safeParse(imported.recipe);
  if (!recipeValidation.success) {
    return NextResponse.json(
      { error: 'Could not parse recipe data', details: recipeValidation.error.flatten() },
      { status: 422 }
    );
  }

  return NextResponse.json({
    recipe: {
      ...imported.recipe,
      name: recipeValidation.data.name,
      description: recipeValidation.data.description ?? undefined,
      ingredients: recipeValidation.data.ingredients ?? [],
      servings: recipeValidation.data.servings ?? 1,
      source_url: imported.recipe.source_url ?? undefined,
      instructions: recipeValidation.data.instructions ?? imported.recipe.instructions ?? undefined,
    },
    image_url: imported.image_url ?? undefined,
    instructions: imported.instructions ?? undefined,
    prep_mins: imported.prep_mins ?? undefined,
    cook_mins: imported.cook_mins ?? undefined,
  });
}
