'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@repo/supabase';

type IncomeSourceInsert = Database['public']['Tables']['income_sources']['Insert'];
type IncomeSourceRow = Database['public']['Tables']['income_sources']['Row'];

export type FrequencyRule = 'specific_date' | 'last_working_day' | 'every_4_weeks';
export type PaymentSource = 'me' | 'partner' | 'joint';

export interface CreateIncomeSourceInput {
  household_id: string;
  name: string;
  amount: number;
  frequency_rule: FrequencyRule;
  day_of_month?: number | null;
  anchor_date?: string | null;
  payment_source: PaymentSource;
  sort_order?: number;
}

export interface UpdateIncomeSourceInput {
  name?: string;
  amount?: number;
  frequency_rule?: FrequencyRule;
  day_of_month?: number | null;
  anchor_date?: string | null;
  payment_source?: PaymentSource;
  sort_order?: number;
  is_active?: boolean;
}

export async function createIncomeSource(
  data: CreateIncomeSourceInput
): Promise<{ incomeSourceId?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const insertData: IncomeSourceInsert = {
      household_id: data.household_id,
      name: data.name.trim(),
      amount: data.amount,
      frequency_rule: data.frequency_rule,
      day_of_month: data.frequency_rule === 'specific_date' ? (data.day_of_month ?? 1) : null,
      anchor_date: data.frequency_rule === 'every_4_weeks' ? data.anchor_date ?? null : null,
      payment_source: data.payment_source,
      sort_order: data.sort_order ?? 0,
      is_active: true,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase.from('income_sources') as any)
      .insert(insertData)
      .select('id')
      .single();

    if (error) return { error: error.message };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/blueprint');
    return { incomeSourceId: (row as { id: string })?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create income source' };
  }
}

export async function updateIncomeSource(
  id: string,
  data: UpdateIncomeSourceInput
): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name.trim();
    if (data.amount !== undefined) update.amount = data.amount;
    if (data.frequency_rule !== undefined) {
      update.frequency_rule = data.frequency_rule;
      if (data.frequency_rule !== 'specific_date') update.day_of_month = null;
      if (data.frequency_rule !== 'every_4_weeks') update.anchor_date = null;
    }
    if (data.day_of_month !== undefined) update.day_of_month = data.day_of_month;
    if (data.anchor_date !== undefined) update.anchor_date = data.anchor_date;
    if (data.payment_source !== undefined) update.payment_source = data.payment_source;
    if (data.sort_order !== undefined) update.sort_order = data.sort_order;
    if (data.is_active !== undefined) update.is_active = data.is_active;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('income_sources') as any).update(update).eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update income source' };
  }
}

export async function deleteIncomeSource(id: string): Promise<{ error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('income_sources') as any).delete().eq('id', id);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete income source' };
  }
}

export async function getIncomeSources(householdId: string): Promise<IncomeSourceRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('income_sources')
    .select('*')
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as IncomeSourceRow[];
}

/**
 * One-time backfill: create income_sources from onboarding data (users.monthly_income,
 * households.partner_income) so they appear on the Income settings tab. Only runs when
 * the household has no income_sources and has legacy income.
 */
export async function backfillIncomeSourcesFromOnboarding(
  householdId: string
): Promise<{ created: number; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from('income_sources')
      .select('id')
      .eq('household_id', householdId)
      .limit(1);
    if (existing && existing.length > 0) return { created: 0 };

    const { data: household } = await supabase
      .from('households')
      .select('owner_id, pay_cycle_type, pay_day, pay_cycle_anchor, partner_income')
      .eq('id', householdId)
      .single();
    if (!household) return { created: 0 };

    const ownerId = (household as { owner_id: string }).owner_id;
    const { data: owner } = await supabase
      .from('users')
      .select('monthly_income')
      .eq('id', ownerId)
      .single();
    const monthlyIncome = (owner as { monthly_income: number } | null)?.monthly_income ?? 0;
    const partnerIncome = Number((household as { partner_income: number }).partner_income ?? 0);

    if (monthlyIncome <= 0 && partnerIncome <= 0) return { created: 0 };

    const cycleType = (household as { pay_cycle_type: FrequencyRule }).pay_cycle_type;
    const payDay = (household as { pay_day: number | null }).pay_day;
    const anchorDate = (household as { pay_cycle_anchor: string | null }).pay_cycle_anchor;
    let created = 0;

    if (monthlyIncome > 0) {
      const insertData: IncomeSourceInsert = {
        household_id: householdId,
        name: 'My salary',
        amount: monthlyIncome,
        frequency_rule: cycleType,
        day_of_month: cycleType === 'specific_date' ? (payDay ?? 1) : null,
        anchor_date: cycleType === 'every_4_weeks' ? anchorDate : null,
        payment_source: 'me',
        sort_order: 0,
        is_active: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('income_sources') as any).insert(insertData);
      if (!error) created += 1;
    }
    if (partnerIncome > 0) {
      const insertData: IncomeSourceInsert = {
        household_id: householdId,
        name: 'Partner salary',
        amount: partnerIncome,
        frequency_rule: cycleType,
        day_of_month: cycleType === 'specific_date' ? (payDay ?? 1) : null,
        anchor_date: cycleType === 'every_4_weeks' ? anchorDate : null,
        payment_source: 'partner',
        sort_order: 1,
        is_active: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('income_sources') as any).insert(insertData);
      if (!error) created += 1;
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/blueprint');
    return { created };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : 'Backfill failed' };
  }
}
