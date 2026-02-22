'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRecipes, useCreateRecipe, useImportRecipeFromUrl, type ImportRecipeFromUrlResponse } from '@/hooks/use-meals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Link2, Search } from 'lucide-react';
import { CreateRecipeDialog } from './create-recipe-dialog';
import { formatRecipeTime } from './recipe-time';

const SEARCH_DEBOUNCE_MS = 300;

export function RecipesPageClient() {
  const [searchInput, setSearchInput] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const { data: recipes, isLoading, error } = useRecipes({ q: searchDebounced || undefined });
  const createRecipe = useCreateRecipe();
  const importFromUrl = useImportRecipeFromUrl();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importedRecipe, setImportedRecipe] = useState<ImportRecipeFromUrlResponse | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleOpenCreate = (prefill?: ImportRecipeFromUrlResponse | null) => {
    setImportedRecipe(prefill ?? null);
    setDialogOpen(true);
  };

  const handleCloseCreate = (open: boolean) => {
    if (!open) setImportedRecipe(null);
    setDialogOpen(open);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground">
          Recipes
        </h1>

        <div className="rounded-lg border border-border bg-card p-4" data-testid="recipes-search">
          <label htmlFor="recipes-search-input" className="mb-2 block text-sm font-medium text-foreground">
            Search recipes
          </label>
          <p className="mb-3 text-sm text-muted-foreground">
            Search by recipe name or ingredient. &quot;cumin&quot; shows recipes that list cumin; &quot;chicken curry&quot; shows recipes containing both words.
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="recipes-search-input"
                type="search"
                placeholder="e.g. tikka, chicken, tofu"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
                data-testid="recipes-search-input"
                aria-label="Search by recipe or ingredient"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenCreate()}
              data-testid="recipes-add-recipe"
              className="gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4" data-testid="recipes-add-from-url">
          <p className="mb-2 text-sm font-medium text-foreground">Add from URL</p>
          <p className="mb-3 text-sm text-muted-foreground">
            Paste a recipe link to import name, ingredients and servings (no ads).
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              type="url"
              placeholder="https://…"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="min-w-[200px] flex-1"
              data-testid="recipes-import-url-input"
              aria-label="Recipe URL"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!urlInput.trim()) return;
                importFromUrl.mutate(urlInput.trim(), {
                  onSuccess: (data) => {
                    setUrlInput('');
                    handleOpenCreate(data);
                  },
                });
              }}
              disabled={importFromUrl.isPending}
              data-testid="recipes-import-fetch"
              className="gap-2"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              {importFromUrl.isPending ? 'Fetching…' : 'Fetch'}
            </Button>
          </div>
          {importFromUrl.isError && (
            <p className="mt-2 text-sm text-destructive" data-testid="recipes-import-error">
              {importFromUrl.error.message}
            </p>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm" data-testid="recipes-error">
            {error.message}
          </p>
        )}
        {isLoading && (
          <p className="text-muted-foreground text-sm" data-testid="recipes-loading">
            Loading…
          </p>
        )}
        {!isLoading && !error && (!recipes || recipes.length === 0) && (
          <div
            className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground"
            data-testid="recipes-empty"
          >
            {searchDebounced ? (
              <p className="mb-2">No recipes match &quot;{searchDebounced}&quot;. Try a different search or clear the box.</p>
            ) : (
              <>
                <p className="mb-2">No recipes yet.</p>
                <Button type="button" variant="outline" onClick={() => handleOpenCreate()}>
                  Add your first recipe
                </Button>
              </>
            )}
          </div>
        )}
        {!isLoading && recipes && recipes.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="recipes-list">
            {recipes.map((r) => {
              const imageUrl = (r as { image_url?: string | null }).image_url;
              const prep_mins = (r as { prep_mins?: number | null }).prep_mins;
              const cook_mins = (r as { cook_mins?: number | null }).cook_mins;
              const timeLabel = formatRecipeTime(prep_mins, cook_mins);
              return (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/meals/recipes/${r.id}`}
                    className="block rounded-lg border border-border bg-card overflow-hidden transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid={`recipe-card-${r.id}`}
                  >
                    {imageUrl && (
                      <div className="aspect-[16/10] w-full bg-muted/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <span className="font-medium text-foreground">{r.name}</span>
                      {r.servings > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          Serves {r.servings}
                        </span>
                      )}
                      {timeLabel && (
                        <span className="mt-1 block text-xs text-muted-foreground" data-testid={`recipe-card-time-${r.id}`}>
                          {timeLabel}
                        </span>
                      )}
                      {(r as { source_url?: string | null }).source_url && (
                        <span className="mt-1 block text-xs text-muted-foreground" data-testid={`recipe-card-source-${r.id}`}>
                          From {(() => {
                            try {
                              return new URL((r as { source_url: string }).source_url).hostname.replace(/^www\./, '');
                            } catch {
                              return 'original source';
                            }
                          })()}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialogOpen && (
        <CreateRecipeDialog
          open={true}
          onOpenChange={handleCloseCreate}
          initialValues={
            importedRecipe
              ? {
                  ...importedRecipe.recipe,
                  image_url: importedRecipe.image_url ?? undefined,
                  prep_mins: importedRecipe.prep_mins ?? undefined,
                  cook_mins: importedRecipe.cook_mins ?? undefined,
                }
              : undefined
          }
          onSubmit={(input) => {
            createRecipe.mutate(input, {
              onSuccess: () => handleCloseCreate(false),
            });
          }}
          isSubmitting={createRecipe.isPending}
          error={createRecipe.error?.message ?? null}
        />
      )}
    </>
  );
}
