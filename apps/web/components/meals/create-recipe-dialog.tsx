'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRecipeSchema, type CreateRecipeInput } from '@repo/logic';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

export function CreateRecipeDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRecipeInput) => void;
  isSubmitting: boolean;
  /** When set, form is pre-filled (e.g. from "Add from URL"). */
  initialValues?: CreateRecipeInput | null;
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
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(createRecipeSchema) as never,
    defaultValues: {
      name: '',
      description: '',
      ingredients: [],
      servings: 1,
      instructions: '',
    },
  });

  const emptyDefaults = {
    name: '',
    description: '',
    ingredients: [] as { name: string; quantity?: string }[],
    servings: 1,
    source_url: undefined as string | undefined,
    instructions: '',
    image_url: undefined as string | undefined,
    prep_mins: undefined as number | undefined,
    cook_mins: undefined as number | undefined,
  };

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
        source_url: initialValues.source_url ?? undefined,
        instructions: initialValues.instructions ?? '',
        image_url: initialValues.image_url ?? undefined,
        prep_mins: initialValues.prep_mins ?? undefined,
        cook_mins: initialValues.cook_mins ?? undefined,
      });
    } else {
      reset(emptyDefaults);
    }
  }, [open, initialValues, reset]);

  const ingredients = watch('ingredients') ?? [];

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
        <form
          onSubmit={handleSubmit((data) => {
            const cleaned: CreateRecipeInput = {
              name: data.name,
              description: data.description ?? undefined,
              ingredients: (data.ingredients ?? []).filter((i) => i.name.trim()).map((i) => ({ name: i.name, quantity: i.quantity || undefined })),
              servings: data.servings ?? 1,
              source_url: data.source_url ?? undefined,
              instructions: data.instructions?.trim() ? data.instructions : undefined,
              image_url: data.image_url?.trim() ? data.image_url : undefined,
              prep_mins: data.prep_mins != null && data.prep_mins > 0 ? data.prep_mins : undefined,
              cook_mins: data.cook_mins != null && data.cook_mins > 0 ? data.cook_mins : undefined,
            };
            onSubmit(cleaned);
          })}
          className="mt-4 flex max-h-[85vh] flex-col"
        >
          <input type="hidden" {...register('source_url')} />
          <input type="hidden" {...register('image_url')} />
          <input type="hidden" {...register('prep_mins', { valueAsNumber: true })} />
          <input type="hidden" {...register('cook_mins', { valueAsNumber: true })} />
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <label htmlFor="recipe-name" className="mb-1 block text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="recipe-name"
              {...register('name')}
              placeholder="e.g. Spaghetti bolognese"
              data-testid="create-recipe-name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="recipe-desc" className="mb-1 block text-sm font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              id="recipe-desc"
              spellCheck
              {...register('description')}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Servings
            </label>
            <Input
              type="number"
              min={1}
              {...register('servings', { valueAsNumber: true })}
              data-testid="create-recipe-servings"
            />
            {errors.servings && (
              <p className="mt-1 text-sm text-destructive">{errors.servings.message}</p>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Ingredients</span>
              <Button type="button" variant="outline" onClick={addIngredient} data-testid="create-recipe-add-ingredient">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              Add quantity (e.g. 200g, 1 cup) when you know it — used for scaling and shopping lists.
            </p>
            <div className="space-y-2">
              {ingredients.map((_, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    {...register(`ingredients.${index}.name`)}
                    placeholder="e.g. tofu, lemon juice"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    aria-label="Ingredient"
                  />
                  <input
                    {...register(`ingredients.${index}.quantity`)}
                    placeholder="e.g. 200g, 1 cup"
                    className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    aria-label="Quantity (optional)"
                    title="Optional: amount for scaling and shopping list"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeIngredient(index)}
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="recipe-instructions" className="mb-1 block text-sm font-medium text-muted-foreground">
              Instructions (optional)
            </label>
            <textarea
              id="recipe-instructions"
              spellCheck
              {...register('instructions')}
              rows={6}
              placeholder="Step-by-step cooking instructions. Filled automatically when importing from a URL."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4 shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} data-testid="create-recipe-submit">
              {isSubmitting ? 'Adding…' : 'Add recipe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
