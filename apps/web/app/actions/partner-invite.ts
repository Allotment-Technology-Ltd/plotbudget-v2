'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';
import { sendPartnerInviteEmail } from '@/lib/email/partner-invite';
import { getAppBaseUrl } from '@/lib/app-url';

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
      partner_user_id: null,
    } as never)
    .eq('owner_id', user.id);

  if (error) throw new Error('Failed to remove partner');

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Partner removed' };
}

/**
 * Accept partner invitation and link the current user as partner.
 * Called from /partner/join after the user has signed up or logged in.
 * Requires authentication; we set partner_user_id so they get RLS access.
 * Use admin client for lookup by token (row not yet visible to partner via RLS).
 */
export async function acceptPartnerInvite(token: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to accept the invitation');

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('households')
    .select('*')
    .eq('partner_auth_token', token)
    .eq('partner_invite_status', 'pending')
    .single();

  const household = data as HouseholdRow | null;
  if (error || !household) {
    throw new Error('Invalid or expired invitation');
  }

  const { error: updateError } = await admin
    .from('households')
    .update({
      partner_user_id: user.id,
      partner_invite_status: 'accepted',
      partner_accepted_at: new Date().toISOString(),
      partner_last_login_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  if (updateError) throw new Error('Failed to accept invitation');

  return { success: true, householdId: household.id };
}

/**
 * Return the partner invite join URL when the household has a pending invite.
 * Used so the owner can copy the link and share via WhatsApp, SMS, etc.
 */
export async function getPartnerInviteLink(): Promise<{ url: string | null }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { url: null };

  const { data } = await supabase
    .from('households')
    .select('partner_auth_token, partner_invite_status')
    .eq('owner_id', user.id)
    .single();

  const household = data as { partner_auth_token: string | null; partner_invite_status: string } | null;
  if (
    !household?.partner_auth_token ||
    household.partner_invite_status !== 'pending'
  ) {
    return { url: null };
  }

  const base = getAppBaseUrl();
  const url = `${base}/partner/join?t=${encodeURIComponent(household.partner_auth_token)}`;
  return { url };
}
