'use client';

import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRecipeSchema, type CreateRecipeInput } from '@repo/logic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export function CreateRecipeDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialValues,
  error: serverError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRecipeInput) => void;
  isSubmitting: boolean;
  /** When set, form is pre-filled (e.g. from "Add from URL"). */
  initialValues?: CreateRecipeInput | null;
  /** Server or mutation error to show (e.g. API 400/500). */
  error?: string | null;
}) {
  type FormValues = {
    name: string;
    description?: string;
    ingredients: { name: string; quantity?: string }[];
    servings: number;
    source_url?: string | null;
    instructions?: string | null;
    image_url?: string | null;
    prep_mins?: number | null;
    cook_mins?: number | null;
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(createRecipeSchema) as never,
    defaultValues: {
      name: '',
      description: '',
      ingredients: [],
      servings: 1,
      instructions: '',
      source_url: null,
      image_url: null,
      prep_mins: null,
      cook_mins: null,
    },
  });

  const emptyDefaults = useMemo<FormValues>(
    () => ({
      name: '',
      description: '',
      ingredients: [] as { name: string; quantity?: string }[],
      servings: 1,
      source_url: null,
      instructions: '',
      image_url: null,
      prep_mins: null,
      cook_mins: null,
    }),
    []
  );

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      reset({
        name: initialValues.name ?? '',
        description: initialValues.description ?? '',
        ingredients: initialValues.ingredients?.length
          ? initialValues.ingredients.map((i: { name: string; quantity?: string }) => ({
              name: i.name,
              quantity: i.quantity ?? '',
            }))
          : [],
        servings: initialValues.servings ?? 1,
        source_url: initialValues.source_url ?? null,
        instructions: initialValues.instructions ?? '',
        image_url: initialValues.image_url ?? null,
        prep_mins: initialValues.prep_mins ?? null,
        cook_mins: initialValues.cook_mins ?? null,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, initialValues, reset, emptyDefaults]);

  const ingredients = useWatch({ control, name: 'ingredients' }) ?? [];
  const errorCount = Object.keys(errors).length;
  const hasErrors = errorCount > 0 || !!serverError;

  const addIngredient = () => {
    setValue('ingredients', [...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index: number) => {
    setValue(
      'ingredients',
      ingredients.filter((_, i) => i !== index)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="create-recipe-dialog">
        <DialogTitle className="font-heading text-lg uppercase tracking-wider">
          Add recipe
        </DialogTitle>
        
        {/* Server-side error alert */}
        {serverError && (
          <div 
            className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
            <div>{serverError}</div>
          </div>
        )}

        {/* Client-side validation summary */}
        {hasErrors && !serverError && errorCount > 0 && (
          <div 
            className="flex gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <div className="font-medium">Please fix the {errorCount} error{errorCount !== 1 ? 's' : ''} below:</div>
              <ul className="mt-1 ml-0 list-disc list-inside text-xs">
                {errors.name && <li>Recipe name is required</li>}
                {errors.servings && <li>Servings must be at least 1</li>}
                {errors.description && <li>Description is too long</li>}
                {errors.instructions && <li>Instructions are too long</li>}
                {errors.ingredients && <li>All ingredients must have a name</li>}
              </ul>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit((data) => {
            const servingsNum = Number(data.servings);
            const servings = Number.isFinite(servingsNum) && servingsNum >= 1 && Number.isInteger(servingsNum) ? servingsNum : 1;
            const sourceUrl = data.source_url?.trim();
            const imageUrl = data.image_url?.trim();
            const cleaned: CreateRecipeInput = {
              name: data.name?.trim() ?? '',
              description: data.description?.trim() || undefined,
              ingredients: (data.ingredients ?? []).filter((i) => i.name.trim()).map((i) => ({ name: i.name, quantity: i.quantity || undefined })),
              servings,
              source_url: sourceUrl && isValidUrl(sourceUrl) ? sourceUrl : undefined,
              instructions: data.instructions?.trim() ? data.instructions : undefined,
              image_url: imageUrl && isValidUrl(imageUrl) ? imageUrl : undefined,
              prep_mins: data.prep_mins != null && data.prep_mins > 0 ? data.prep_mins : undefined,
              cook_mins: data.cook_mins != null && data.cook_mins > 0 ? data.cook_mins : undefined,
            };
            onSubmit(cleaned);
          })}
          className="mt-4 flex max-h-[85vh] flex-col"
          noValidate
        >
          <input type="hidden" {...register('source_url')} />
          <input type="hidden" {...register('image_url')} />
          <input type="hidden" {...register('prep_mins', { valueAsNumber: true })} />
          <input type="hidden" {...register('cook_mins', { valueAsNumber: true })} />
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            
            {/* Name Field */}
            <div>
              <label htmlFor="recipe-name" className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                Name
                <span className="text-destructive" aria-label="required">*</span>
              </label>
              <Input
                id="recipe-name"
                {...register('name')}
                placeholder="e.g. Spaghetti bolognese"
                data-testid="create-recipe-name"
                className={`${errors.name ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : ''}`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <div id="name-error" className="flex gap-1 mt-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{errors.name.message}</span>
                </div>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="recipe-desc" className="mb-1 block text-sm font-medium text-muted-foreground">
                Description <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="recipe-desc"
                spellCheck
                {...register('description')}
                rows={2}
                className={`w-full rounded-md border bg-background px-3 py-2 text-foreground transition-colors ${
                  errors.description ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : 'border-border'
                }`}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <div id="description-error" className="flex gap-1 mt-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{errors.description.message}</span>
                </div>
              )}
            </div>

            {/* Servings Field */}
            <div>
              <label htmlFor="recipe-servings" className="mb-1 flex items-center gap-1 text-sm font-medium text-foreground">
                Servings
                <span className="text-destructive" aria-label="required">*</span>
              </label>
              <Input
                id="recipe-servings"
                type="number"
                min={1}
                {...register('servings', { valueAsNumber: true })}
                data-testid="create-recipe-servings"
                className={`${errors.servings ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : ''}`}
                aria-invalid={!!errors.servings}
                aria-describedby={errors.servings ? 'servings-error' : undefined}
              />
              {errors.servings && (
                <div id="servings-error" className="flex gap-1 mt-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{errors.servings.message}</span>
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Ingredients</span>
                <Button type="button" variant="outline" onClick={addIngredient} data-testid="create-recipe-add-ingredient">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add ingredient</span>
                </Button>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                Add quantity (e.g. 200g, 1 cup) when you know it — used for scaling and shopping lists.
              </p>
              <div className="space-y-3">
                {ingredients.map((_, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          {...register(`ingredients.${index}.name`)}
                          placeholder="e.g. tofu, lemon juice"
                          className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-colors ${
                            errors.ingredients?.[index]?.name ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : 'border-border'
                          }`}
                          aria-label={`Ingredient ${index + 1} name`}
                          aria-invalid={!!errors.ingredients?.[index]?.name}
                          aria-describedby={errors.ingredients?.[index]?.name ? `ingredient-${index}-name-error` : undefined}
                        />
                      </div>
                      <div className="w-28">
                        <input
                          {...register(`ingredients.${index}.quantity`)}
                          placeholder="e.g. 200g, 1 cup"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors"
                          aria-label={`Ingredient ${index + 1} quantity (optional)`}
                          title="Optional: amount for scaling and shopping list"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeIngredient(index)}
                        aria-label={`Remove ingredient ${index + 1}`}
                        className="mt-0 h-10 w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                    {errors.ingredients?.[index]?.name && (
                      <div id={`ingredient-${index}-name-error`} className="flex gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" aria-hidden />
                        <span>{errors.ingredients[index].name.message}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Array-level error for ingredients */}
              {errors.ingredients && typeof errors.ingredients === 'object' && !Array.isArray(errors.ingredients) && 'message' in errors.ingredients && (
                <div className="flex gap-1 mt-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{(errors.ingredients as { message?: string }).message}</span>
                </div>
              )}
            </div>

            {/* Instructions Field */}
            <div>
              <label htmlFor="recipe-instructions" className="mb-1 block text-sm font-medium text-muted-foreground">
                Instructions <span className="text-xs text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="recipe-instructions"
                spellCheck
                {...register('instructions')}
                rows={6}
                placeholder="Step-by-step cooking instructions. Filled automatically when importing from a URL."
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground transition-colors ${
                  errors.instructions ? 'border-destructive focus:border-destructive focus:ring-destructive/50' : 'border-border'
                }`}
                aria-invalid={!!errors.instructions}
                aria-describedby={errors.instructions ? 'instructions-error' : undefined}
              />
              {errors.instructions && (
                <div id="instructions-error" className="flex gap-1 mt-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{errors.instructions.message}</span>
                </div>
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || hasErrors} 
              data-testid="create-recipe-submit"
              title={hasErrors ? 'Please fix all errors before submitting' : ''}
            >
              {isSubmitting ? 'Adding…' : 'Add recipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
