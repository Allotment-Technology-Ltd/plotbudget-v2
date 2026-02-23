// @ts-nocheck
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

type IncomeSourceInsert = Database['public']['Tables']['income_sources']['Insert'];
type IncomeSourceRow = Database['public']['Tables']['income_sources']['Row'];
type IncomeSourceUpdate = Database['public']['Tables']['income_sources']['Update'];

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
  data: CreateIncomeSourceInput,
  client?: SupabaseClient
): Promise<{ incomeSourceId?: string; error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());
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
    const { data: row, error } = await supabase
      .from('income_sources')
      .insert(insertData)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!row) return { error: 'Income source create did not persist. Please try again.' };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/money/blueprint');
    return { incomeSourceId: row.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create income source' };
  }
}

export async function updateIncomeSource(
  id: string,
  data: UpdateIncomeSourceInput,
  client?: SupabaseClient
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());
    const update: IncomeSourceUpdate = {};
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

    const { data: updated, error } = await supabase
      .from('income_sources')
      .update(update)
      .eq('id', id)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!updated) return { error: 'Income source update did not persist. Please try again.' };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/money/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update income source' };
  }
}

export async function deleteIncomeSource(
  id: string,
  client?: SupabaseClient
): Promise<{ error?: string }> {
  try {
    const supabase = client ?? (await createServerSupabaseClient());
    const { data: deleted, error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', id)
      .select('id')
      .single();

    if (error) return { error: error.message };
    if (!deleted) return { error: 'Income source delete did not persist. Please try again.' };
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/money/blueprint');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete income source' };
  }
}

export async function getIncomeSources(
  householdId: string,
  client?: SupabaseClient<Database>
): Promise<IncomeSourceRow[]> {
  const supabase = client ?? (await createServerSupabaseClient());
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
    let monthlyIncome = (owner as { monthly_income: number } | null)?.monthly_income ?? 0;
    let partnerIncome = Number((household as { partner_income: number }).partner_income ?? 0);

    // Fallback: if user/household income not set (e.g. onboarding bug or legacy), use latest paycycle snapshot
    if (monthlyIncome <= 0 && partnerIncome <= 0) {
      const { data: paycycle } = await supabase
        .from('paycycles')
        .select('snapshot_user_income, snapshot_partner_income')
        .eq('household_id', householdId)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      const snap = paycycle as { snapshot_user_income?: number; snapshot_partner_income?: number } | null;
      if (snap && (Number(snap.snapshot_user_income ?? 0) > 0 || Number(snap.snapshot_partner_income ?? 0) > 0)) {
        monthlyIncome = Number(snap.snapshot_user_income ?? 0);
        partnerIncome = Number(snap.snapshot_partner_income ?? 0);
      } else {
        return { created: 0 };
      }
    }

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
      const { error } = await supabase.from('income_sources').insert(insertData);
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
      const { error } = await supabase.from('income_sources').insert(insertData);
      if (!error) created += 1;
    }

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/money/blueprint');
    return { created };
  } catch (e) {
    return { created: 0, error: e instanceof Error ? e.message : 'Backfill failed' };
  }
}
