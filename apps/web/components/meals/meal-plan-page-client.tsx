'use client';

import { useMealPlan, useRecipes, useMealPlanSettings, useUpdateMealPlanSettings } from '@/hooks/use-meals';
import { format, addDays, startOfWeek } from 'date-fns';
import { useState } from 'react';
import type { MealPlanEntryWithRecipe } from '@/hooks/use-meals';
import { MealPlanDayDialog } from './meal-plan-day-dialog';
import { MEAL_SLOTS, MEAL_SLOT_LABELS, type MealSlot } from './meal-plan-constants';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
/** Dropdown order: Saturday, Sunday, Monday, … Friday */
const WEEK_START_ORDER: (0 | 1 | 2 | 3 | 4 | 5 | 6)[] = [6, 0, 1, 2, 3, 4, 5];

function entryLabel(entry: MealPlanEntryWithRecipe): string {
  if (entry.free_text?.trim()) return entry.free_text.trim();
  const recipe = (entry as { recipe?: { name: string } | null }).recipe;
  return recipe?.name ?? 'Recipe';
}

function getSlot(entry: MealPlanEntryWithRecipe): MealSlot {
  const slot = (entry as { meal_slot?: string }).meal_slot;
  return MEAL_SLOTS.includes(slot as MealSlot) ? (slot as MealSlot) : 'dinner';
}

function groupEntriesBySlot(entries: MealPlanEntryWithRecipe[]): Record<MealSlot, MealPlanEntryWithRecipe[]> {
  const out: Record<MealSlot, MealPlanEntryWithRecipe[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    other: [],
  };
  for (const e of entries) {
    const slot = getSlot(e);
    out[slot].push(e);
  }
  return out;
}

export function MealPlanPageClient() {
  const { data: settings, isLoading: settingsLoading } = useMealPlanSettings();
  const updateSettings = useUpdateMealPlanSettings();
  const weekStartsOn = Math.min(6, Math.max(0, settings?.week_start_day ?? 0)) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const weekStart = startOfWeek(new Date(), { weekStartsOn });
  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const { data: entries, isLoading, error } = useMealPlan({ from, to });
  const { data: recipes = [] } = useRecipes();
  const [dialogDate, setDialogDate] = useState<string | null>(null);

  const entriesByDate = (entries ?? []).reduce(
    (acc, e) => {
      const d = e.planned_date;
      if (!acc[d]) acc[d] = [];
      acc[d].push(e);
      return acc;
    },
    {} as Record<string, MealPlanEntryWithRecipe[]>
  );

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  if (error) {
    return (
      <p className="text-destructive" data-testid="meal-plan-error">
        {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground">
            Meal plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Click a day to add breakfast, lunch and dinner. Add recipes, free-type meals (e.g. takeaway, leftovers), or mark batch cooking.
          </p>
        </div>
        {!settingsLoading && (
          <div className="flex items-center gap-2" data-testid="meal-plan-settings">
            <label htmlFor="meal-plan-week-start" className="text-sm text-muted-foreground whitespace-nowrap">
              Plan week starts on
            </label>
            <select
              id="meal-plan-week-start"
              value={weekStartsOn}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 0 && v <= 6) updateSettings.mutate({ week_start_day: v });
              }}
              disabled={updateSettings.isPending}
              className="input-select text-sm"
              aria-label="Day the meal plan week starts"
            >
              {WEEK_START_ORDER.map((dayIndex) => (
                <option key={dayIndex} value={dayIndex}>
                  {DAY_NAMES[dayIndex]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
          This week
        </h2>
        {isLoading ? (
          <p className="text-muted-foreground text-sm" data-testid="meal-plan-loading">
            Loading…
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="meal-plan-days">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEntries = entriesByDate[dateStr] ?? [];
              const bySlot = groupEntriesBySlot(dayEntries);
              const dateLabel = format(day, 'EEE d MMM');
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setDialogDate(dateStr)}
                  className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid={`meal-plan-day-${dateStr}`}
                  aria-label={`Edit meals for ${dateLabel}`}
                >
                  <div className="font-medium text-foreground mb-3">
                    {dateLabel}
                  </div>
                  <div className="space-y-2 text-sm">
                    {MEAL_SLOTS.map((slot) => {
                      const slotEntries = bySlot[slot];
                      if (slotEntries.length === 0) return null;
                      return (
                        <div key={slot}>
                          <span className="text-muted-foreground font-medium">{MEAL_SLOT_LABELS[slot]}: </span>
                          <span className="text-foreground">
                            {slotEntries.map((e) => entryLabel(e)).join(', ')}
                          </span>
                        </div>
                      );
                    })}
                    {dayEntries.length === 0 && (
                      <p className="text-muted-foreground">No meals planned</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dialogDate && (
        <MealPlanDayDialog
          open={!!dialogDate}
          onOpenChange={(open) => !open && setDialogDate(null)}
          date={dialogDate}
          dateLabel={dialogDate ? format(new Date(dialogDate), 'EEE d MMM') : ''}
          entries={entriesByDate[dialogDate] ?? []}
          weekEntries={entries ?? []}
          recipes={recipes}
        />
      )}
    </div>
  );
}
