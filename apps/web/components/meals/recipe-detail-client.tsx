'use client';

import Link from 'next/link';
import { useRecipe, useDeleteRecipe } from '@/hooks/use-meals';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { RecipeIngredient } from '@repo/logic';
import { formatRecipeTime } from './recipe-time';

/** Derive a short display name from source URL for attribution (e.g. bbcgoodfood.com). */
function sourceDisplayName(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return host;
  } catch {
    return url;
  }
}

function ingredientsFromRecipe(r: { ingredients: unknown }): RecipeIngredient[] {
  if (Array.isArray(r.ingredients)) return r.ingredients as RecipeIngredient[];
  return [];
}

/** Decode HTML entities for display (e.g. &#039; → apostrophe). */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = parseInt(hex, 16);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    });
}

export function RecipeDetailClient({ recipeId }: { recipeId: string }) {
  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();

  if (isLoading) {
    return <p className="text-muted-foreground" data-testid="recipe-detail-loading">Loading…</p>;
  }
  if (error || !recipe) {
    return (
      <div data-testid="recipe-detail-error">
        <p className="text-destructive">{error?.message ?? 'Recipe not found.'}</p>
        <Link href="/dashboard/meals/recipes" className="text-sm text-primary underline mt-2 inline-block">
          Back to recipes
        </Link>
      </div>
    );
  }

  const ingredients = ingredientsFromRecipe(recipe);
  const description = recipe.description ? decodeHtmlEntities(recipe.description) : '';
  const timeLabel = formatRecipeTime((recipe as { prep_mins?: number | null }).prep_mins, (recipe as { cook_mins?: number | null }).cook_mins);
  const instructions = (recipe as { instructions?: string | null }).instructions
    ? decodeHtmlEntities((recipe as { instructions: string }).instructions)
    : '';

  return (
    <div className="max-w-5xl">
      <Link
        href="/dashboard/meals/recipes"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        data-testid="recipe-detail-back"
      >
        <ArrowLeft className="h-4 w-4" />
        Recipes
      </Link>
      <div className="rounded-lg border border-border bg-card overflow-hidden" data-testid={`recipe-detail-${recipe.id}`}>
        {(recipe as { image_url?: string | null }).image_url && (
          <div className="aspect-[21/9] w-full bg-muted/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(recipe as { image_url: string }).image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-2">
          {recipe.name}
        </h1>
        {recipe.servings > 0 && (
          <p className="text-sm text-muted-foreground mb-2">Serves {recipe.servings}</p>
        )}
        {timeLabel && (
          <p className="text-sm text-muted-foreground mb-4" data-testid="recipe-detail-time">
            {timeLabel}
          </p>
        )}
        {description && (
          <p className="text-foreground mb-6 whitespace-pre-wrap">{description}</p>
        )}

        {(recipe as { source_url?: string | null }).source_url && (
          <p className="text-sm text-muted-foreground mb-6" data-testid="recipe-detail-source">
            Recipe from{' '}
            <a
              href={(recipe as { source_url: string }).source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline hover:no-underline"
            >
              {sourceDisplayName((recipe as { source_url: string }).source_url)}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
          </p>
        )}

        {/* Two-column layout on md+: ingredients sticky left, instructions right — no scroll ping-pong */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
          <aside
            className="rounded-lg border border-border bg-muted/30 p-4 md:sticky md:top-4"
            aria-label="Ingredients"
          >
            <h2 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">
              Ingredients
            </h2>
            <ul className="list-disc list-inside space-y-1.5 text-foreground text-sm" data-testid="recipe-ingredients">
              {ingredients.length === 0 ? (
                <li className="text-muted-foreground">No ingredients listed.</li>
              ) : (
                ingredients.map((i, idx) => (
                  <li key={idx}>
                    {i.quantity ? `${i.quantity} ${i.name}` : i.name}
                  </li>
                ))
              )}
            </ul>
          </aside>
          <div className="min-w-0">
            {instructions ? (
              <>
                <h2 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">
                  Instructions
                </h2>
                <div className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                  {instructions}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No instructions saved for this recipe.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => deleteRecipe.mutate(recipe.id, { onSuccess: () => window.location.href = '/dashboard/meals/recipes' })}
            disabled={deleteRecipe.isPending}
            data-testid="recipe-detail-delete"
          >
            {deleteRecipe.isPending ? 'Deleting…' : 'Delete recipe'}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
