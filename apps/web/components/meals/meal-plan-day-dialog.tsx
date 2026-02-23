'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import type { MealPlanEntryWithRecipe } from '@/hooks/use-meals';
import { useCreateMealPlanEntry, useDeleteMealPlanEntry, usePantryMatch, useMarkMealPlanEntryCooked } from '@/hooks/use-meals';
import { useCreateTask } from '@/hooks/use-tasks';
import { useCreateEvent, useUpdateEvent, useEvents } from '@/hooks/use-events';
import { getModule } from '@repo/logic';
import type { Recipe } from '@repo/supabase';
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlot } from './meal-plan-constants';

const MEALS_MODULE_NAME = getModule('meals').name;

type MealPlanDayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  dateLabel: string;
  entries: MealPlanEntryWithRecipe[];
  weekEntries: MealPlanEntryWithRecipe[];
  recipes: Recipe[];
};

function entryLabel(entry: MealPlanEntryWithRecipe): string {
  if (entry.free_text?.trim()) return entry.free_text.trim();
  const recipe = (entry as { recipe?: { name: string } | null }).recipe;
  return recipe?.name ?? 'Recipe';
}

function getSlot(entry: MealPlanEntryWithRecipe): MealSlot {
  const slot = (entry as { meal_slot?: string }).meal_slot;
  return MEAL_SLOTS.includes(slot as MealSlot) ? (slot as MealSlot) : 'dinner';
}

function groupBySlot(entries: MealPlanEntryWithRecipe[]): Record<MealSlot, MealPlanEntryWithRecipe[]> {
  const out: Record<MealSlot, MealPlanEntryWithRecipe[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    other: [],
  };
  for (const e of entries) {
    out[getSlot(e)].push(e);
  }
  return out;
}

/** Format a week entry for "Leftovers from" dropdown: "Mon 16 Feb dinner – Curry" */
function weekEntryOptionLabel(entry: MealPlanEntryWithRecipe): string {
  const slot = getSlot(entry);
  const date = (entry as { planned_date: string }).planned_date;
  const d = new Date(date + 'Z');
  const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${dayLabel} ${MEAL_SLOT_LABELS[slot]} – ${entryLabel(entry)}`;
}

function buildDayEventTitle(entries: MealPlanEntryWithRecipe[]): string {
  const bySlot = groupBySlot(entries);
  const parts: string[] = [];
  MEAL_SLOTS.forEach((slot) => {
    const slotEntries = bySlot[slot];
    if (slotEntries.length === 0) return;
    const titles = slotEntries.map((e) => entryLabel(e)).join(', ');
    parts.push(`${MEAL_SLOT_LABELS[slot]}: ${titles}`);
  });
  return parts.length === 0 ? MEALS_MODULE_NAME : `${MEALS_MODULE_NAME} – ${parts.join(' · ')}`;
}

export function MealPlanDayDialog({
  open,
  onOpenChange,
  date,
  dateLabel,
  entries,
  weekEntries,
  recipes,
}: MealPlanDayDialogProps) {
  const [addMode, setAddMode] = useState<'recipe' | 'free'>('recipe');
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>('dinner');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [freeText, setFreeText] = useState('');
  const [isBatchCook, setIsBatchCook] = useState(false);
  const [leftoversFromId, setLeftoversFromId] = useState<string>('');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [addToTasks, setAddToTasks] = useState(true);
  const dayMealEventIdRef = useRef<string | null>(null);
  const createEntry = useCreateMealPlanEntry();
  const deleteEntry = useDeleteMealPlanEntry();
  const createTask = useCreateTask();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const markCooked = useMarkMealPlanEntryCooked();
  const dayEventsRange = { start: `${date}T00:00:00.000Z`, end: `${date}T23:59:59.999Z` };
  const { data: dayEvents = [] } = useEvents(dayEventsRange);
  const existingMealEvent = dayEvents.find((ev) => (ev as { source_module?: string | null }).source_module === 'meals');

  useEffect(() => {
    if (!open) dayMealEventIdRef.current = null;
  }, [open]);
  useEffect(() => {
    dayMealEventIdRef.current = null;
  }, [date]);
  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);
  const pantryMatch = usePantryMatch(
    selectedRecipeId && selectedRecipe
      ? {
          recipeId: selectedRecipeId,
          recipeServings: selectedRecipe.servings ?? 1,
          entryServings: 1,
        }
      : null
  );
  const pantryAdvisoryMatches = pantryMatch.data?.matches ?? [];

  const bySlot = groupBySlot(entries);
  const otherWeekEntries = weekEntries.filter((e) => e.planned_date !== date || !entries.some((x) => x.id === e.id));

  const syncDayToCalendar = (allEntriesForDay: MealPlanEntryWithRecipe[]) => {
    const title = buildDayEventTitle(allEntriesForDay);
    if (!title || title === MEALS_MODULE_NAME) return;
    const mealEventIdToUpdate = dayMealEventIdRef.current ?? existingMealEvent?.id ?? null;
    if (mealEventIdToUpdate) {
      updateEvent.mutate({ id: mealEventIdToUpdate, title });
    } else {
      createEvent.mutate(
        {
          title,
          start_at: `${date}T12:00:00.000Z`,
          all_day: true,
          source_module: 'meals',
          source_entity_id: allEntriesForDay[0]?.id ?? undefined,
        },
        { onSuccess: (ev) => { dayMealEventIdRef.current = ev.id; } }
      );
    }
  };

  const handleAdd = () => {
    const base = {
      planned_date: date,
      meal_slot: selectedSlot,
      is_batch_cook: isBatchCook,
    };
    if (addMode === 'recipe' && selectedRecipeId) {
      createEntry.mutate(
        { ...base, recipe_id: selectedRecipeId },
        {
          onSuccess: (newEntry) => {
            if (addToTasks) {
              const label = newEntry.free_text?.trim() ? newEntry.free_text.trim() : (newEntry as { recipe?: { name?: string } }).recipe?.name ?? 'Recipe';
              const isBatch = (newEntry as { is_batch_cook?: boolean }).is_batch_cook;
              createTask.mutate({
                name: isBatch ? `Batch cook: ${label}` : `Cook: ${label}`,
                due_date: (newEntry as { planned_date: string }).planned_date,
                linked_module: 'meals',
                linked_entity_id: newEntry.id,
              });
            }
            if (addToCalendar) {
              const allEntriesForDay = [...entries, newEntry as MealPlanEntryWithRecipe];
              syncDayToCalendar(allEntriesForDay);
            }
            setSelectedRecipeId('');
            setIsBatchCook(false);
            setLeftoversFromId('');
          },
        }
      );
      return;
    }
    if (addMode === 'free' && freeText.trim()) {
      createEntry.mutate(
        {
          ...base,
          free_text: freeText.trim(),
          leftovers_from_meal_plan_entry_id: leftoversFromId || null,
        },
        {
          onSuccess: (newEntry) => {
            if (addToTasks) {
              const label = (newEntry as { free_text?: string }).free_text?.trim() ?? 'Meal';
              createTask.mutate({
                name: `Cook: ${label}`,
                due_date: (newEntry as { planned_date: string }).planned_date,
                linked_module: 'meals',
                linked_entity_id: newEntry.id,
              });
            }
            if (addToCalendar) {
              const allEntriesForDay = [...entries, newEntry as MealPlanEntryWithRecipe];
              syncDayToCalendar(allEntriesForDay);
            }
            setFreeText('');
            setLeftoversFromId('');
          },
        }
      );
    }
  };

  const canAdd =
    (addMode === 'recipe' && selectedRecipeId) || (addMode === 'free' && freeText.trim().length > 0);



  const hasAnyEntries = entries.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto" data-testid="meal-plan-day-dialog">
        <DialogHeader>
          <DialogTitle>{MEALS_MODULE_NAME} for {dateLabel}</DialogTitle>
          <DialogDescription>
            Add breakfast, lunch or dinner from a recipe or free-type (e.g. takeaway, leftovers). Mark batch cooking or link leftovers to a previous meal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasAnyEntries ? (
            <div className="space-y-3" data-testid="meal-plan-day-entries">
              {MEAL_SLOTS.map((slot) => {
                const slotEntries = bySlot[slot];
                if (slotEntries.length === 0) return null;
                return (
                  <div key={slot}>
                    <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                      {MEAL_SLOT_LABELS[slot]}
                    </h3>
                    <ul className="space-y-1">
                      {slotEntries.map((e) => (
                        <li
                          key={e.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                          data-testid={`meal-plan-day-entry-${e.id}`}
                        >
                          <span className="text-foreground">
                            {entryLabel(e)}
                            {(e as { is_batch_cook?: boolean }).is_batch_cook && (
                              <span className="ml-2 text-xs text-muted-foreground">(batch)</span>
                            )}
                            {(e as { cooked_at?: string | null }).cooked_at && (
                              <span className="ml-2 text-xs text-muted-foreground">(cooked)</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {e.recipe_id && !(e as { cooked_at?: string | null }).cooked_at && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => markCooked.mutate(e.id)}
                                    disabled={markCooked.isPending}
                                    data-testid={`meal-plan-day-mark-cooked-${e.id}`}
                                  >
                                    <ChefHat className="h-3.5 w-3.5 mr-1" />
                                    Mark cooked
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  Mark as cooked and deduct ingredients from pantry
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteEntry.mutate(e.id)}
                              disabled={deleteEntry.isPending}
                              aria-label={`Remove ${entryLabel(e)}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="meal-plan-day-no-entries">
              No meals planned. Add one below.
            </p>
          )}

          <div className="rounded-lg border border-border bg-card p-3 space-y-3" data-testid="meal-plan-day-add">
            <fieldset className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Meal slot">
              <legend className="sr-only">Meal slot</legend>
              {MEAL_SLOTS.map((slot) => (
                <label
                  key={slot}
                  className={`inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                    selectedSlot === slot
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="meal-slot"
                    value={slot}
                    checked={selectedSlot === slot}
                    onChange={() => setSelectedSlot(slot)}
                    className="sr-only"
                    data-testid={`meal-plan-day-slot-${slot}`}
                  />
                  {MEAL_SLOT_LABELS[slot]}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                  className="h-5 w-5 rounded border-border cursor-pointer"
                  data-testid="meal-plan-day-add-to-calendar"
                />
                Add to calendar
              </label>
              <label className="flex items-center gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={addToTasks}
                  onChange={(e) => setAddToTasks(e.target.checked)}
                  className="h-5 w-5 rounded border-border cursor-pointer"
                  data-testid="meal-plan-day-add-to-tasks"
                />
                Add to tasks
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={addMode === 'recipe' ? 'primary' : 'outline'}
                className="text-sm py-1.5 px-2"
                onClick={() => setAddMode('recipe')}
                data-testid="meal-plan-day-add-recipe-tab"
              >
                From recipe
              </Button>
              <Button
                type="button"
                variant={addMode === 'free' ? 'primary' : 'outline'}
                className="text-sm py-1.5 px-2"
                onClick={() => setAddMode('free')}
                data-testid="meal-plan-day-add-free-tab"
              >
                Free type
              </Button>
            </div>
            {addMode === 'recipe' ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-end gap-2">
                  <select
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="input-select min-w-[200px] text-sm"
                    data-testid="meal-plan-day-recipe-select"
                    aria-label="Choose recipe"
                  >
                    <option value="">Select recipe</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isBatchCook}
                      onChange={(e) => setIsBatchCook(e.target.checked)}
                      className="rounded border-border"
                    />
                    Batch cook
                  </label>
                </div>
                {pantryAdvisoryMatches.length > 0 && (
                  <div
                    className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                    data-testid="meal-plan-day-pantry-advisory"
                    role="status"
                  >
                    <span className="font-medium text-foreground">You have some of this in your pantry:</span>
                    <span className="ml-1">Check that amounts are still accurate.</span>
                    <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
                      {pantryAdvisoryMatches.map((m) => (
                        <li key={m.pantryId}>
                          {m.ingredientName} — recipe: {m.recipeQuantityText}, pantry: {m.pantryQuantityText} ({m.pantryLocation})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button
                  type="button"
                  className="gap-1 text-sm py-1.5 px-2"
                  onClick={handleAdd}
                  disabled={!canAdd || createEntry.isPending}
                  data-testid="meal-plan-day-add-button"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  type="text"
                  placeholder="e.g. Takeaway, Leftovers from Monday, Eating out"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  className="min-w-[200px] flex-1 max-w-md"
                  data-testid="meal-plan-day-free-input"
                  aria-label="Free-form meal"
                  maxLength={200}
                />
                {otherWeekEntries.length > 0 && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Leftovers from (optional)</label>
                    <select
                      value={leftoversFromId}
                      onChange={(e) => setLeftoversFromId(e.target.value)}
                      className="input-select w-full text-sm"
                      data-testid="meal-plan-day-leftovers-from"
                    >
                      <option value="">—</option>
                      {otherWeekEntries.map((e) => (
                        <option key={e.id} value={e.id}>
                          {weekEntryOptionLabel(e)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button
                  type="button"
                  className="gap-1 text-sm py-1.5 px-2"
                  onClick={handleAdd}
                  disabled={!canAdd || createEntry.isPending}
                  data-testid="meal-plan-day-add-free-button"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            )}
            {(createEntry.isError || deleteEntry.isError) && (
              <p className="text-sm text-destructive" data-testid="meal-plan-day-error">
                {createEntry.error?.message ?? deleteEntry.error?.message}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
