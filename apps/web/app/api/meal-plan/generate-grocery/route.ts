import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import {
  generateGroceryItemsFromMealPlan,
  type MealPlanEntryForGrocery,
  type RecipeWithServings,
} from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: { from?: string; to?: string; create_shopping_task?: boolean } = {};
  try { body = await request.json(); } catch { /* optional body */ }

  let fromDate = body.from;
  let toDate = body.to;
  if (fromDate == null || toDate == null) {
    const { data: household } = await supabase
      .from('households')
      .select('meal_plan_week_start_day')
      .eq('id', householdId)
      .single();
    const weekStartsOn = Math.min(6, Math.max(0, Number((household as { meal_plan_week_start_day?: number } | null)?.meal_plan_week_start_day ?? 0)));
    const now = new Date();
    const start = new Date(now);
    const day = now.getDay();
    const diff = (day - weekStartsOn + 7) % 7;
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    fromDate = fromDate ?? start.toISOString().slice(0, 10);
    toDate = toDate ?? end.toISOString().slice(0, 10);
  }

  const { data: entries, error: fetchError } = await supabase
    .from('meal_plan_entries')
    .select('id, recipe_id, planned_date, servings, leftovers_from_meal_plan_entry_id, recipe:recipes(id, ingredients, servings)')
    .eq('household_id', householdId)
    .gte('planned_date', fromDate)
    .lte('planned_date', toDate)
    .order('planned_date', { ascending: true });

  if (fetchError) return NextResponse.json({ error: fetchError.message ?? 'Failed to fetch meal plan' }, { status: 500 });

  const forGrocery: MealPlanEntryForGrocery[] = (entries ?? [])
    .filter((e: { recipe_id: string | null; recipe: unknown; leftovers_from_meal_plan_entry_id?: string | null }) =>
      e.recipe_id != null && e.recipe != null && e.leftovers_from_meal_plan_entry_id == null
    )
    .map((e: { id: string; recipe_id: string; planned_date: string; servings: number | null; recipe: { id: string; ingredients: unknown; servings: number } }) => {
      const r = e.recipe;
      const ingredients = Array.isArray(r?.ingredients) ? r.ingredients : [];
      return {
        id: e.id,
        recipe_id: e.recipe_id,
        planned_date: e.planned_date,
        servings: e.servings,
        recipe: { id: r.id, ingredients, servings: r.servings ?? 1 } as RecipeWithServings,
      };
    });

  const items = generateGroceryItemsFromMealPlan(forGrocery);
  if (items.length === 0) {
    return NextResponse.json({ created: 0, grocery_item_ids: [], task_id: null });
  }

  const maxOrder = await supabase
    .from('grocery_items')
    .select('sort_order')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const baseOrder = (maxOrder.data as { sort_order: number } | null)?.sort_order ?? 0;
  const rows: InsertTables<'grocery_items'>[] = items.map((item, i) => ({
    household_id: householdId,
    name: item.name,
    quantity_text: item.quantity_text,
    quantity_value: item.quantity_value,
    quantity_unit: item.quantity_unit,
    source_recipe_id: item.source_recipe_id,
    source_meal_plan_entry_id: item.source_meal_plan_entry_id,
    sort_order: baseOrder + i + 1,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('grocery_items')
    .insert(rows as never)
    .select('id');

  if (insertError) return NextResponse.json({ error: insertError.message ?? 'Failed to create grocery items' }, { status: 500 });
  const ids = (inserted ?? []).map((r: { id: string }) => r.id);

  let taskId: string | null = null;
  if (body.create_shopping_task) {
    const { data: task } = await supabase
      .from('tasks')
      .insert({
        household_id: householdId,
        name: 'Do the weekly shop',
        status: 'todo',
        linked_module: 'meals',
        linked_entity_id: null,
        created_by: user.id,
      } as never)
      .select('id')
      .single();
    if (task) taskId = (task as { id: string }).id;
    if (taskId) {
      await supabase.from('activity_feed').insert({
        household_id: householdId,
        actor_user_id: user.id,
        actor_type: 'user',
        action: 'created',
        object_name: 'Do the weekly shop',
        object_detail: null,
        source_module: 'tasks',
        source_entity_id: taskId,
        action_url: `/dashboard/tasks?task=${taskId}`,
        metadata: {},
      } as never);
    }
  }

  return NextResponse.json({ created: ids.length, grocery_item_ids: ids, task_id: taskId });
}
