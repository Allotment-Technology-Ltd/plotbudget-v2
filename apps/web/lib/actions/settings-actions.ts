'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type UsersUpdate = Database['public']['Tables']['users']['Update'];
type HouseholdsUpdate = Database['public']['Tables']['households']['Update'];
type PaycyclesUpdate = Database['public']['Tables']['paycycles']['Update'];
type UserRow = Pick<Database['public']['Tables']['users']['Row'], 'monthly_income'>;
type PaycycleRow = Pick<Database['public']['Tables']['paycycles']['Row'], 'id'>;

const displayNameSchema = z
  .string()
  .min(1, 'Display name cannot be empty')
  .max(50, 'Display name must be 50 characters or less')
  .regex(
    /^[a-zA-Z0-9\s\-']+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes'
  );

const householdNameSchema = z
  .string()
  .min(1, 'Household name cannot be empty')
  .max(50, 'Household name must be 50 characters or less');

export async function updateUserProfile(displayName: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const validatedName = displayNameSchema.parse(displayName.trim());

  const payload: UsersUpdate = { display_name: validatedName };
  const { error } = await supabase.from('users').update(payload as never).eq('id', user.id);

  if (error) {
    throw new Error('Failed to update profile');
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
}

export async function updateHouseholdName(householdId: string, name: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const validatedName = householdNameSchema.parse(name.trim());

  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('id', householdId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!household) {
    throw new Error('Household not found or unauthorized');
  }

  const namePayload: HouseholdsUpdate = { name: validatedName };
  const { error } = await supabase.from('households').update(namePayload as never).eq('id', householdId);

  if (error) {
    throw new Error('Failed to update household');
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
}

const partnerNameSchema = z
  .string()
  .min(1, 'Partner name cannot be empty')
  .max(50, 'Partner name must be 50 characters or less');

const partnerIncomeSchema = z.number().min(0, 'Partner income cannot be negative');

/** Update only partner name. Partner income is managed in Settings → Income. */
export async function updatePartnerName(householdId: string, partnerName: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const validatedName = partnerNameSchema.parse(partnerName.trim());

  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('id', householdId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!household) {
    throw new Error('Household not found or unauthorized');
  }

  const householdPayload: HouseholdsUpdate = {
    partner_name: validatedName,
  };
  const { error } = await supabase
    .from('households')
    .update(householdPayload as never)
    .eq('id', householdId);

  if (error) {
    throw new Error('Failed to update household');
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
}

export async function updatePartnerDetails(
  householdId: string,
  partnerName: string,
  partnerIncome: number
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const validatedName = partnerNameSchema.parse(partnerName.trim());
  const validatedIncome = partnerIncomeSchema.parse(partnerIncome);

  const { data: household } = await supabase
    .from('households')
    .select('id, partner_income, total_monthly_income')
    .eq('id', householdId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!household) {
    throw new Error('Household not found or unauthorized');
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('monthly_income')
    .eq('id', user.id)
    .single();

  const profile = userProfile as UserRow | null;
  const userIncome = profile?.monthly_income ?? 0;
  const totalMonthlyIncome = userIncome + validatedIncome;

  const householdPayload: HouseholdsUpdate = {
    partner_name: validatedName,
    partner_income: validatedIncome,
    total_monthly_income: totalMonthlyIncome,
  };
  const { error: householdError } = await supabase.from('households').update(householdPayload as never).eq('id', householdId);

  if (householdError) {
    throw new Error('Failed to update household');
  }

  const { data: activePaycycle } = await supabase
    .from('paycycles')
    .select('id')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .maybeSingle();

  const paycycle = activePaycycle as PaycycleRow | null;
  if (paycycle) {
    const paycyclePayload: PaycyclesUpdate = {
      snapshot_partner_income: validatedIncome,
      total_income: totalMonthlyIncome,
    };
    await supabase.from('paycycles').update(paycyclePayload as never).eq('id', paycycle.id);
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');
}
