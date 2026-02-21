'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@repo/supabase';
import { sendPartnerInviteEmail } from '@/lib/email/partner-invite';
import { getAppBaseUrl } from '@/lib/app-url';
import { logAuditEvent } from '@/lib/audit';

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

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_invite_sent',
    resource: 'household',
    resourceDetail: { householdId: household.id },
  });

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Invitation sent!' };
}

/**
 * Create a shareable partner invite link without sending email.
 * Sets household to pending with a new token; owner can copy link and share (e.g. WhatsApp, SMS).
 * Optionally send email later via sendPartnerInviteToEmail.
 */
export async function createPartnerInviteLink(): Promise<{ url: string }> {
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
      partner_email: null,
      partner_auth_token: token,
      partner_invite_status: 'pending',
      partner_invite_sent_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  if (updateError) throw new Error('Failed to create invite link');

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_invite_sent',
    resource: 'household',
    resourceDetail: { householdId: household.id, linkOnly: true },
  });

  revalidatePath('/dashboard/settings');

  const base = getAppBaseUrl();
  const url = `${base}/partner/join?t=${encodeURIComponent(token)}`;
  return { url };
}

/**
 * Send partner invite email to the given address when invite is already pending (e.g. link-only).
 * Updates household partner_email and sends the same join link via email.
 */
export async function sendPartnerInviteToEmail(partnerEmail: string) {
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
  if (!household) throw new Error('Household not found');
  if (household.partner_invite_status !== 'pending') {
    throw new Error('No pending invitation');
  }
  if (!household.partner_auth_token) throw new Error('No invite link');

  const { error: updateError } = await supabase
    .from('households')
    .update({
      partner_email: partnerEmail,
      partner_invite_sent_at: new Date().toISOString(),
    } as never)
    .eq('id', household.id);

  if (updateError) throw new Error('Failed to update household');

  await sendPartnerInviteEmail(
    partnerEmail,
    user.email ?? '',
    household.partner_auth_token
  );

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_invite_sent',
    resource: 'household',
    resourceDetail: { householdId: household.id, sendToEmail: true },
  });

  revalidatePath('/dashboard/settings');

  return { success: true, message: 'Invitation email sent!' };
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

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_invite_sent',
    resource: 'household',
    resourceDetail: { householdId: household.id, resend: true },
  });

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

  const { data: householdsWithPartner } = await supabase
    .from('households')
    .select('partner_user_id')
    .eq('owner_id', user.id)
    .not('partner_user_id', 'is', null);

  const partnerUserIds = Array.from(
    new Set(
      ((householdsWithPartner ?? []) as { partner_user_id: string | null }[])
        .map((row) => row.partner_user_id)
        .filter((id): id is string => !!id)
    )
  );

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

  if (partnerUserIds.length > 0) {
    const admin = createAdminClient();
    await admin
      .from('users')
      .update({
        household_id: null,
        current_paycycle_id: null,
        has_completed_onboarding: false,
      } as never)
      .in('id', partnerUserIds);
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_invite_revoked',
    resource: 'household',
  });

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

  // Keep exactly one partner household association per user to prevent
  // ambiguous partner context and onboarding redirects.
  await admin
    .from('households')
    .update({
      partner_user_id: null,
      partner_invite_status: 'none',
      partner_email: null,
      partner_auth_token: null,
      partner_invite_sent_at: null,
      partner_accepted_at: null,
      partner_last_login_at: null,
    } as never)
    .eq('partner_user_id', user.id)
    .neq('id', household.id);

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

  const { data: activePaycycle } = await admin
    .from('paycycles')
    .select('id')
    .eq('household_id', household.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email ?? `${user.id}@plot.invalid`,
        household_id: household.id,
        current_paycycle_id:
          (activePaycycle as { id: string } | null)?.id ?? null,
        has_completed_onboarding: true,
      } as never,
      { onConflict: 'id' }
    );

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_joined',
    resource: 'household',
    resourceDetail: { householdId: household.id },
  });

  return { success: true, householdId: household.id };
}

/**
 * Partner leaves the household (unlinks themselves). Does not sign out or redirect — caller does that.
 * Use when partner clicks "Leave" so they can be re-invited later and sign in to rejoin.
 */
export async function leaveHouseholdAsPartner(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const admin = createAdminClient();
  const { error } = await admin
    .from('households')
    .update({
      partner_user_id: null,
      partner_invite_status: 'none',
      partner_email: null,
      partner_auth_token: null,
      partner_invite_sent_at: null,
      partner_accepted_at: null,
      partner_last_login_at: null,
    } as never)
    .eq('partner_user_id', user.id);

  if (error) throw new Error('Failed to leave household');

  await admin
    .from('users')
    .update({
      household_id: null,
      current_paycycle_id: null,
      has_completed_onboarding: false,
    } as never)
    .eq('id', user.id);

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_removed',
    resource: 'household',
    resourceDetail: { selfLeft: true },
  });
}

/**
 * Owner removes partner and deletes the partner's account (GDPR: delete on behalf).
 */
export async function removePartnerAndDeleteAccount(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: household } = await supabase
    .from('households')
    .select('partner_user_id')
    .eq('owner_id', user.id)
    .single();

  const partnerUserId = (household as { partner_user_id: string | null } | null)?.partner_user_id;
  if (!partnerUserId) throw new Error('No partner to remove');

  const admin = createAdminClient();

  const { error: updateError } = await admin
    .from('households')
    .update({
      partner_user_id: null,
      partner_email: null,
      partner_auth_token: null,
      partner_invite_status: 'none',
      partner_invite_sent_at: null,
      partner_accepted_at: null,
      partner_last_login_at: null,
    } as never)
    .eq('partner_user_id', partnerUserId);

  if (updateError) throw new Error('Failed to remove partner');

  await logAuditEvent({
    userId: user.id,
    eventType: 'partner_removed',
    resource: 'household',
    resourceDetail: { removedUserId: partnerUserId },
  });

  const { error: userDeleteError } = await admin
    .from('users')
    .delete()
    .eq('id', partnerUserId);

  if (userDeleteError) throw new Error('Failed to delete partner profile');

  try {
    await admin.auth.admin.deleteUser(partnerUserId);
  } catch (err) {
    console.error('Failed to delete partner auth user:', err);
  }

  revalidatePath('/dashboard/settings');
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
