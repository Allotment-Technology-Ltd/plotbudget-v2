import { z } from 'zod';

/** Single ingredient line: name + quantity e.g. "chicken", "200g" */
export const recipeIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(), // e.g. "200g", "1", "2 tbsp"
});

export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

/** Import-from-URL: only https. Server should also reject localhost/127.0.0.1 in production. */
export const importRecipeFromUrlSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'Only HTTPS URLs are allowed' }),
});

export type ImportRecipeFromUrlInput = z.infer<typeof importRecipeFromUrlSchema>;

export const createRecipeSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  ingredients: z.array(recipeIngredientSchema).default([]),
  servings: z.number().int().min(1).default(1),
  source_url: z.string().url().max(2000).optional().nullable(),
  instructions: z.string().max(15000).optional().nullable(),
  /** External image URL only (no uploads); stored as text to avoid object-storage cost. */
  image_url: z.string().url().max(2000).optional().nullable(),
  prep_mins: z.number().int().min(0).max(999).optional().nullable(),
  cook_mins: z.number().int().min(0).max(999).optional().nullable(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

export const updateRecipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  ingredients: z.array(recipeIngredientSchema).optional(),
  servings: z.number().int().min(1).optional(),
  source_url: z.string().url().max(2000).optional().nullable(),
  instructions: z.string().max(15000).optional().nullable(),
  /** External image URL only (no uploads). */
  image_url: z.string().url().max(2000).optional().nullable(),
  prep_mins: z.number().int().min(0).max(999).optional().nullable(),
  cook_mins: z.number().int().min(0).max(999).optional().nullable(),
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

const freeTextMax = 200;

const mealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'other']);

export const createMealPlanEntrySchema = z
  .object({
    recipe_id: z.string().uuid().optional().nullable(),
    free_text: z.string().max(freeTextMax).optional().nullable(),
    planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    servings: z.number().int().min(1).optional().nullable(),
    sort_order: z.number().int().optional(),
    meal_slot: mealSlotSchema.optional(),
    is_batch_cook: z.boolean().optional(),
    leftovers_from_meal_plan_entry_id: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      const hasRecipe = data.recipe_id != null && data.recipe_id !== '';
      const hasFreeText = data.free_text != null && data.free_text.trim() !== '';
      return hasRecipe || hasFreeText;
    },
    { message: 'Provide either a recipe or free-text meal (e.g. Takeaway, Leftovers).' }
  );

export type CreateMealPlanEntryInput = z.infer<typeof createMealPlanEntrySchema>;

export const updateMealPlanEntrySchema = z.object({
  id: z.string().uuid(),
  recipe_id: z.string().uuid().optional().nullable(),
  free_text: z.string().max(freeTextMax).optional().nullable(),
  planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  servings: z.number().int().min(1).optional().nullable(),
  sort_order: z.number().int().optional(),
  meal_slot: mealSlotSchema.optional(),
  is_batch_cook: z.boolean().optional(),
  leftovers_from_meal_plan_entry_id: z.string().uuid().optional().nullable(),
});

export type UpdateMealPlanEntryInput = z.infer<typeof updateMealPlanEntrySchema>;

export const createGroceryItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity_text: z.string().max(100).optional().nullable(),
  quantity_value: z.number().optional().nullable(),
  quantity_unit: z.string().max(50).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export type CreateGroceryItemInput = z.infer<typeof createGroceryItemSchema>;

export const updateGroceryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  quantity_text: z.string().max(100).optional().nullable(),
  quantity_value: z.number().optional().nullable(),
  quantity_unit: z.string().max(50).optional().nullable(),
  is_checked: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export type UpdateGroceryItemInput = z.infer<typeof updateGroceryItemSchema>;

const pantryLocationSchema = z.string().min(1).max(100).trim();

export const createPantryItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity_value: z.number().optional().nullable(),
  quantity_unit: z.string().max(50).optional().nullable(),
  location: pantryLocationSchema.default('pantry'),
  notes: z.string().max(500).optional().nullable(),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemSchema>;

export const updatePantryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  quantity_value: z.number().optional().nullable(),
  quantity_unit: z.string().max(50).optional().nullable(),
  location: pantryLocationSchema.optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;
