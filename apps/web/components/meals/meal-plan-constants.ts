/** Meal slot for planning breakfast, lunch, dinner (and other). */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'other'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  other: 'Other',
};
