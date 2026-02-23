import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createGroceryItemSchema, type CreateGroceryItemInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const checked = searchParams.get('checked'); // 'true' | 'false' to filter
  const shoppingListId = searchParams.get('shopping_list_id');
  const isStaple = searchParams.get('is_staple'); // 'true' to fetch staples only
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '200', 10) || 200, 1), 500);

  let query = supabase
    .from('grocery_items')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (checked === 'true') query = query.eq('is_checked', true);
  if (checked === 'false') query = query.eq('is_checked', false);
  if (shoppingListId) query = query.eq('shopping_list_id', shoppingListId);
  if (isStaple === 'true') query = query.eq('is_staple', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch grocery list' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createGroceryItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreateGroceryItemInput = parsed.data;

  // If a shopping_list_id is supplied, verify it belongs to this household
  if (input.shopping_list_id) {
    const { data: list } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('id', input.shopping_list_id)
      .eq('household_id', householdId)
      .single();
    if (!list) return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
  }

  const row: InsertTables<'grocery_items'> = {
    household_id: householdId,
    name: input.name,
    quantity_text: input.quantity_text ?? null,
    quantity_value: input.quantity_value ?? null,
    quantity_unit: input.quantity_unit ?? null,
    shopping_list_id: input.shopping_list_id ?? null,
    actual_price: input.actual_price ?? null,
    is_staple: input.is_staple ?? false,
    sort_order: input.sort_order ?? 0,
  };

  const { data: created, error } = await supabase.from('grocery_items').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create grocery item' }, { status: 500 });
  return NextResponse.json(created as object);
}
