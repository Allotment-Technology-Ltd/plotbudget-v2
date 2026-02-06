'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { sendPartnerInviteEmail } from '@/lib/email/partner-invite';

type HouseholdRow = Database['public']['Tables']['households']['Row'];

/**
 * Generate and send partner invitation.
 * Called from Settings → Household tab.
 */
export async function invitePartner(partnerEmail: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  const household = data as HouseholdRow | null;
  if (householdError || !household) throw new Error('Household not found');
  if (!household.is_couple) throw new Error('Not in couple mode');

  const token = crypto.randomBytes(32).toString('hex');

  const { error: updateError } = await supabase
    .from('households')
    .update({
      partner_email: partnerEmail,
      partner_auth_token: token,
      partner_invite_status: 'pending',
      partner_invite_sent_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  if (updateError) throw new Error('Failed to update household');

  await sendPartnerInviteEmail(partnerEmail, user.email ?? '', token);

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Invitation sent!' };
}

/**
 * Resend partner invitation.
 */
export async function resendPartnerInvite() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data } = await supabase
    .from('households')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  const household = data as HouseholdRow | null;
  if (!household?.partner_email) throw new Error('No partner invited');
  if (household.partner_invite_status !== 'pending') {
    throw new Error('Partner already accepted');
  }

  await supabase
    .from('households')
    .update({
      partner_invite_sent_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  await sendPartnerInviteEmail(
    household.partner_email,
    user.email ?? '',
    household.partner_auth_token ?? ''
  );

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Invitation resent!' };
}

/**
 * Remove partner access.
 */
export async function removePartner() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('households')
    .update({
      partner_email: null,
      partner_auth_token: null,
      partner_invite_status: 'none',
      partner_invite_sent_at: null,
      partner_accepted_at: null,
      partner_last_login_at: null,
    } as never)
    .eq('owner_id', user.id);

  if (error) throw new Error('Failed to remove partner');

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Partner removed' };
}

/**
 * Accept partner invitation.
 * Called from /partner/join page.
 */
export async function acceptPartnerInvite(token: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('partner_auth_token', token)
    .eq('partner_invite_status', 'pending')
    .single();

  const household = data as HouseholdRow | null;
  if (error || !household) {
    throw new Error('Invalid or expired invitation');
  }

  await supabase
    .from('households')
    .update({
      partner_invite_status: 'accepted',
      partner_accepted_at: new Date().toISOString(),
      partner_last_login_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  return { success: true, householdId: household.id };
}
