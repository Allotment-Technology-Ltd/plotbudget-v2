'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  useRecipes,
  useSuggestExternal,
  useCreateRecipe,
  useCreateMealPlanEntry,
} from '@/hooks/use-meals';
import type { SuggestExternalResponse } from '@/hooks/use-meals';
import { getModule } from '@repo/logic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlot } from './meal-plan-constants';
import { formatRecipeTime } from './recipe-time';
import { ChefHat, CalendarPlus, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

const MAX_INGREDIENTS = 20;

/** Diet options for web recipe search (Spoonacular). Value must match API. */
const DIET_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any diet' },
  { value: 'gluten free', label: 'Gluten free' },
  { value: 'ketogenic', label: 'Ketogenic' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'lacto-vegetarian', label: 'Lacto-vegetarian' },
  { value: 'ovo-vegetarian', label: 'Ovo-vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescetarian', label: 'Pescetarian' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'primal', label: 'Primal' },
  { value: 'low fodmap', label: 'Low FODMAP' },
  { value: 'whole30', label: 'Whole30' },
];

/** Intolerance options for web recipe search (Spoonacular). Value must match API. */
const INTOLERANCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'egg', label: 'Egg' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'grain', label: 'Grain' },
  { value: 'peanut', label: 'Peanut' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'sesame', label: 'Sesame' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'sulfite', label: 'Sulfite' },
  { value: 'tree nut', label: 'Tree nut' },
  { value: 'wheat', label: 'Wheat' },
];

/** Number of web results to show. */
const NUMBER_OPTIONS = [5, 10, 15, 20] as const;

/** Meal type options for web search (Spoonacular `type`). Focus on breakfast / lunch / dinner + common. */
const MEAL_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'main course', label: 'Lunch or dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'soup', label: 'Soup' },
  { value: 'salad', label: 'Salad' },
  { value: 'side dish', label: 'Side dish' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'dessert', label: 'Dessert' },
];

/** Max ready time (minutes). Optional; only applies to web suggestions. */
const MAX_READY_TIME_OPTIONS: { value: number | ''; label: string }[] = [
  { value: '', label: 'Any time' },
  { value: 15, label: 'Under 15 min' },
  { value: 30, label: 'Under 30 min' },
  { value: 45, label: 'Under 45 min' },
  { value: 60, label: 'Under 60 min' },
];

function parseIngredientChips(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_INGREDIENTS);
}

/** Fixed height for all recipe cards (your recipes + web) so grid rows are consistent. */
const RECIPE_CARD_HEIGHT = 'h-[11rem]';

type WebSuggestion = SuggestExternalResponse['suggestions'][number];
function WebRecipeCard({
  s,
  expanded,
  onToggleExpand,
  onAddToMealPlan,
}: {
  s: WebSuggestion;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddToMealPlan: () => void;
}) {
  return (
    <div
      className={`flex gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50 ${RECIPE_CARD_HEIGHT}`}
      data-testid={`what-can-i-cook-web-${s.id}`}
    >
      {s.image ? (
        <img
          src={s.image}
          alt=""
          className="h-20 w-20 shrink-0 rounded object-cover"
          width={80}
          height={80}
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded bg-muted/50" aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="font-heading text-sm font-medium uppercase tracking-wider text-foreground mt-0 mb-0 line-clamp-2 shrink-0"
          title={s.title?.trim() || undefined}
        >
          {s.title?.trim() || 'Recipe'}
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Uses {s.usedIngredientCount} of your ingredients
          {s.missedIngredientCount > 0 && ` · ${s.missedIngredientCount} missing`}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-3">
          <a
            href={s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            View recipe
          </a>
          <button
            type="button"
            onClick={(e) => (e.preventDefault(), e.stopPropagation(), onToggleExpand())}
            className="w-fit text-left text-xs text-muted-foreground underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-expanded={expanded}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 h-8 shrink-0 gap-1.5 px-3 text-xs"
            onClick={(e) => (e.preventDefault(), onAddToMealPlan())}
            data-testid={`what-can-i-cook-web-add-meal-plan-${s.id}`}
            aria-label="Add this recipe to your meal plan"
          >
            <CalendarPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Add to plan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WhatCanICookClient() {
  const [inputValue, setInputValue] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [diet, setDiet] = useState('');
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [numberOfResults, setNumberOfResults] = useState<number>(5);
  const [mealType, setMealType] = useState('');
  const [maxReadyTime, setMaxReadyTime] = useState<number | ''>('');
  const [expandedWebIds, setExpandedWebIds] = useState<Set<string>>(new Set());
  const [expandedYourIds, setExpandedYourIds] = useState<Set<string>>(new Set());
  const [addToMealPlanSuggestion, setAddToMealPlanSuggestion] = useState<WebSuggestion | null>(null);
  const [addToMealPlanDate, setAddToMealPlanDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [addToMealPlanSlot, setAddToMealPlanSlot] = useState<MealSlot>('dinner');
  const moduleColor = getModule('meals').colorLight;
  const createRecipe = useCreateRecipe();
  const createMealPlanEntry = useCreateMealPlanEntry();

  const toggleWebExpanded = useCallback((id: string | number) => {
    setExpandedWebIds((prev) => {
      const next = new Set(prev);
      if (next.has(String(id))) next.delete(String(id));
      else next.add(String(id));
      return next;
    });
  }, []);
  const toggleYourExpanded = useCallback((id: string) => {
    setExpandedYourIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAddToMealPlanSubmit = useCallback(() => {
    if (!addToMealPlanSuggestion) return;
    const title = addToMealPlanSuggestion.title;
    const sourceUrl = addToMealPlanSuggestion.sourceUrl;
    createRecipe.mutate(
      { name: title, source_url: sourceUrl },
      {
        onSuccess: (recipe) => {
          createMealPlanEntry.mutate(
            {
              recipe_id: recipe.id,
              planned_date: addToMealPlanDate,
              meal_slot: addToMealPlanSlot,
            },
            { onSuccess: () => setAddToMealPlanSuggestion(null) }
          );
        },
      }
    );
  }, [addToMealPlanSuggestion, addToMealPlanDate, addToMealPlanSlot, createRecipe, createMealPlanEntry]);

  const toggleIntolerance = useCallback((value: string) => {
    setIntolerances((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  }, []);

  const addFromInput = useCallback(() => {
    const parsed = parseIngredientChips(inputValue);
    if (parsed.length === 0) return;
    setChips((prev) => {
      const combined = [...prev];
      for (const p of parsed) {
        if (!combined.includes(p) && combined.length < MAX_INGREDIENTS) combined.push(p);
      }
      return combined.slice(0, MAX_INGREDIENTS);
    });
    setInputValue('');
  }, [inputValue]);

  const removeChip = useCallback((index: number) => {
    setChips((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const searchQuery = chips.length > 0 ? chips.join(' ') : undefined;
  const { data: recipes, isLoading: recipesLoading, error: recipesError } = useRecipes({ q: searchQuery });
  const webFilters = {
    ...(diet || intolerances.length > 0
      ? { diet: diet || undefined, intolerances: intolerances.length > 0 ? intolerances : undefined }
      : {}),
    number: numberOfResults,
    ...(mealType ? { type: mealType } : {}),
    ...(maxReadyTime !== '' ? { maxReadyTime: maxReadyTime as number } : {}),
  };
  const { data: external, isLoading: externalLoading, error: externalError } = useSuggestExternal(chips, webFilters);

  const hasSearched = chips.length > 0;
  const fromYourRecipes = (recipes ?? []).slice(0, 12);
  const fromWeb = external?.suggestions ?? [];
  const externalEnabled = external?.externalEnabled ?? false;
  const externalProvider = external?.externalProvider;

  return (
    <div className="flex flex-col gap-10" data-testid="what-can-i-cook-page">
      <div>
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-2">
          What can I cook tonight?
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter ingredients you have; we&apos;ll suggest recipes from your collection and from the web.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6" data-testid="what-can-i-cook-input">
        <label htmlFor="what-can-i-cook-ingredients" className="mb-2 block text-sm font-medium text-foreground">
          Ingredients you have
        </label>
        <p className="mb-4 text-sm text-muted-foreground">
          Add ingredients as you think of them (e.g. chicken, onion, rice). Recipes can match any of them — you don&apos;t need to use all. We&apos;ll suggest from your collection and from the web if configured.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            id="what-can-i-cook-ingredients"
            type="text"
            placeholder="e.g. chicken, onion, tomato"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFromInput())}
            className="min-w-[200px] flex-1 max-w-md h-11"
            data-testid="what-can-i-cook-ingredients-input"
            aria-label="Ingredients you have"
            spellCheck
            autoComplete="off"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addFromInput}
            data-testid="what-can-i-cook-add"
            className="h-11 shrink-0 gap-2 px-4"
            aria-label="Add ingredient"
          >
            Add
          </Button>
        </div>
        <div className="mt-6 pt-6 border-t border-border" data-testid="what-can-i-cook-filters">
          <p className="text-sm font-medium text-foreground mb-2">Web search options</p>
          <p className="text-xs text-muted-foreground mb-4">
            Only applies to &quot;More ideas from the web&quot;. Set how many results, meal type, max time, diet, or allergens to exclude.
          </p>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 sm:gap-8 items-end">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="what-can-i-cook-number" className="text-xs text-muted-foreground">
                  Number of results
                </label>
                <Select
                  value={String(numberOfResults)}
                  onValueChange={(v) => setNumberOfResults(Number(v))}
                >
                  <SelectTrigger
                    id="what-can-i-cook-number"
                    className="min-w-[10rem] pl-3"
                    data-testid="what-can-i-cook-number"
                    aria-label="Number of web results"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NUMBER_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="what-can-i-cook-meal-type" className="text-xs text-muted-foreground">
                  Meal type
                </label>
                <Select value={mealType || 'any'} onValueChange={(v) => setMealType(v === 'any' ? '' : v)}>
                  <SelectTrigger
                    id="what-can-i-cook-meal-type"
                    className="min-w-[10rem] pl-3"
                    data-testid="what-can-i-cook-meal-type"
                    aria-label="Meal type (breakfast, lunch, dinner, etc.)"
                  >
                    <SelectValue placeholder="Any meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || 'any'} value={opt.value || 'any'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="what-can-i-cook-max-time" className="text-xs text-muted-foreground">
                  Max ready time
                </label>
                <Select
                  value={maxReadyTime === '' ? 'any' : String(maxReadyTime)}
                  onValueChange={(v) => setMaxReadyTime(v === 'any' ? '' : Number(v))}
                >
                  <SelectTrigger
                    id="what-can-i-cook-max-time"
                    className="min-w-[10rem] pl-3"
                    data-testid="what-can-i-cook-max-time"
                    aria-label="Maximum time to cook (minutes)"
                  >
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAX_READY_TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value === '' ? 'any' : opt.value} value={opt.value === '' ? 'any' : String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="what-can-i-cook-diet" className="text-xs text-muted-foreground">
                  Diet (optional)
                </label>
                <Select value={diet || 'any'} onValueChange={(v) => setDiet(v === 'any' ? '' : v)}>
                  <SelectTrigger
                    id="what-can-i-cook-diet"
                    className="min-w-[10rem] pl-3"
                    data-testid="what-can-i-cook-diet"
                    aria-label="Diet filter"
                  >
                    <SelectValue placeholder="Any diet" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value || 'any'} value={opt.value || 'any'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">Exclude (allergies / intolerances)</span>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-0.5" role="group" aria-label="Exclude intolerances">
                  {INTOLERANCE_OPTIONS.map((opt) => (
                    <label key={opt.value} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={intolerances.includes(opt.value)}
                        onChange={() => toggleIntolerance(opt.value)}
                        className="rounded border-input"
                        data-testid={`what-can-i-cook-intolerance-${opt.value.replace(/\s/g, '-')}`}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {chips.length > 0 && (
          <>
            <ul className="mt-5 flex flex-wrap gap-3" data-testid="what-can-i-cook-chips">
            {chips.map((chip, i) => (
              <li key={`${chip}-${i}`}>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-sm">
                  {chip}
                  <button
                    type="button"
                    onClick={() => removeChip(i)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Remove ${chip}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
            </ul>
            <Button
              type="button"
              onClick={() => document.getElementById('what-can-i-cook-results')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ backgroundColor: moduleColor }}
              data-testid="what-can-i-cook-find-recipes"
              className="mt-5 shrink-0 gap-2"
              aria-label="Find recipes from your ingredients"
            >
              <ChefHat className="h-4 w-4 shrink-0" aria-hidden />
              Find recipes
            </Button>
          </>
        )}
      </div>

      {!hasSearched && (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center text-muted-foreground"
          data-testid="what-can-i-cook-empty"
        >
          Add ingredients above, then click <strong>Find recipes</strong> to see suggestions from your collection and from the web.
        </div>
      )}

      {hasSearched && (
        <div id="what-can-i-cook-results" className="space-y-10">
          <section aria-labelledby="your-recipes-heading">
            <h2 id="your-recipes-heading" className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
              From your recipes
            </h2>
            {recipesError && (
              <p className="text-destructive text-sm mb-3" data-testid="what-can-i-cook-recipes-error">
                {recipesError.message}
              </p>
            )}
            {recipesLoading && (
              <p className="text-muted-foreground text-sm" data-testid="what-can-i-cook-recipes-loading">
                Loading…
              </p>
            )}
            {!recipesLoading && !recipesError && fromYourRecipes.length === 0 && (
              <p className="text-muted-foreground text-sm" data-testid="what-can-i-cook-recipes-none">
                No recipes in your collection mention any of these ingredients. Try different ingredients or add more recipes.
              </p>
            )}
            {!recipesLoading && fromYourRecipes.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="what-can-i-cook-your-recipes">
                {fromYourRecipes.map((r) => {
                  const expanded = expandedYourIds.has(r.id);
                  const timeLabel = formatRecipeTime((r as { prep_mins?: number | null }).prep_mins, (r as { cook_mins?: number | null }).cook_mins);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/dashboard/meals/recipes/${r.id}`}
                        className={`flex h-full gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${RECIPE_CARD_HEIGHT}`}
                        data-testid={`what-can-i-cook-recipe-${r.id}`}
                      >
                        {(r as { image_url?: string | null }).image_url ? (
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-muted/50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={(r as { image_url: string }).image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-20 shrink-0 rounded bg-muted/50" aria-hidden />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p
                            className={expanded ? 'font-medium text-foreground' : 'font-medium text-foreground line-clamp-2'}
                            title={r.name}
                          >
                            {r.name}
                          </p>
                          {r.servings > 0 && (
                            <span className="mt-1.5 block text-sm text-muted-foreground">Serves {r.servings}</span>
                          )}
                          {timeLabel && (
                            <span className="mt-1 block text-xs text-muted-foreground">{timeLabel}</span>
                          )}
                          <div className="mt-auto pt-3">
                            <button
                              type="button"
                              onClick={(e) => (e.preventDefault(), e.stopPropagation(), toggleYourExpanded(r.id))}
                              className="w-fit text-left text-xs text-muted-foreground underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                              aria-expanded={expanded}
                            >
                              {expanded ? 'Show less' : 'Show more'}
                            </button>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="web-ideas-heading">
            <h2 id="web-ideas-heading" className="font-heading text-lg uppercase tracking-wider text-foreground mb-4">
              More ideas from the web
            </h2>
            {!externalEnabled && (
              <p className="text-muted-foreground text-sm mb-3" data-testid="what-can-i-cook-external-disabled">
                Web suggestions can be enabled by adding a Spoonacular API key in the server environment. See deployment docs for details.
              </p>
            )}
            {externalError && (
              <p className="text-destructive text-sm mb-2" data-testid="what-can-i-cook-external-error">
                {externalError.message}
              </p>
            )}
            {externalLoading && (
              <p className="text-muted-foreground text-sm" data-testid="what-can-i-cook-external-loading">
                Loading…
              </p>
            )}
            {externalEnabled && !externalLoading && !externalError && fromWeb.length === 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-3" data-testid="what-can-i-cook-spoonacular-instructions-notice">
                  To view full recipe instructions on Spoonacular&apos;s website, you may need to create a free Spoonacular account.
                </p>
                <p className="text-muted-foreground text-sm" data-testid="what-can-i-cook-external-none">
                  No web suggestions for this combination. Try adding or changing ingredients.
                </p>
              </>
            )}
            {externalEnabled && fromWeb.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground mb-4" data-testid="what-can-i-cook-spoonacular-instructions-notice">
                  To view full recipe instructions on Spoonacular&apos;s website, you may need to create a free Spoonacular account. You can add any web result to your meal plan; we&apos;ll save it as a recipe with a link to the instructions.
                </p>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="what-can-i-cook-web">
                  {fromWeb.map((s) => (
                    <li key={String(s.id)}>
                      <WebRecipeCard
                        s={s}
                        expanded={expandedWebIds.has(String(s.id))}
                        onToggleExpand={() => toggleWebExpanded(s.id)}
                        onAddToMealPlan={() => setAddToMealPlanSuggestion(s)}
                      />
                    </li>
                  ))}
                </ul>
                {externalProvider === 'spoonacular' && (
                  <p className="text-xs text-muted-foreground mt-4" data-testid="what-can-i-cook-spoonacular-attribution">
                    Powered by Spoonacular
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <Dialog open={!!addToMealPlanSuggestion} onOpenChange={(open) => !open && setAddToMealPlanSuggestion(null)}>
        <DialogContent showClose className="max-w-md" data-testid="what-can-i-cook-add-meal-plan-dialog">
          <DialogTitle>Add to meal plan</DialogTitle>
          {addToMealPlanSuggestion && (
            <>
              <p className="text-sm text-muted-foreground">
                We&apos;ll save &quot;{addToMealPlanSuggestion.title}&quot; as a recipe in your collection and add it to your meal plan. Instructions stay on Spoonacular (link in the recipe).
              </p>
              <div className="grid gap-4 py-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <input
                    type="date"
                    value={addToMealPlanDate}
                    onChange={(e) => setAddToMealPlanDate(e.target.value)}
                    className={SELECT_CLASSES}
                    data-testid="what-can-i-cook-meal-plan-date"
                    aria-label="Planned date"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Meal</span>
                  <select
                    value={addToMealPlanSlot}
                    onChange={(e) => setAddToMealPlanSlot(e.target.value as MealSlot)}
                    className={SELECT_CLASSES}
                    data-testid="what-can-i-cook-meal-plan-slot"
                    aria-label="Meal slot"
                  >
                    {MEAL_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {MEAL_SLOT_LABELS[slot]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddToMealPlanSuggestion(null)}
                  data-testid="what-can-i-cook-meal-plan-cancel"
                  className="shrink-0"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleAddToMealPlanSubmit}
                  disabled={createRecipe.isPending || createMealPlanEntry.isPending}
                  data-testid="what-can-i-cook-meal-plan-submit"
                  className="shrink-0"
                >
                  {createRecipe.isPending || createMealPlanEntry.isPending ? 'Adding…' : 'Add to plan'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
