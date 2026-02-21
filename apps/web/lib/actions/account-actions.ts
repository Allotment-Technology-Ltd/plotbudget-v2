'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatDisplayNameForLabel } from '@/lib/utils/display-name';
import { logAuditEvent } from '@/lib/audit';

const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters');

type PaycycleRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  snapshot_user_income: number;
  snapshot_partner_income: number;
  total_allocated: number;
  rem_needs_me: number;
  rem_needs_partner: number;
  rem_needs_joint: number;
  rem_wants_me: number;
  rem_wants_partner: number;
  rem_wants_joint: number;
  rem_savings_me: number;
  rem_savings_partner: number;
  rem_savings_joint: number;
  rem_repay_me: number;
  rem_repay_partner: number;
  rem_repay_joint: number;
};

function paycycleRemaining(pc: PaycycleRow): number {
  return (
    pc.rem_needs_me +
    pc.rem_needs_partner +
    pc.rem_needs_joint +
    pc.rem_wants_me +
    pc.rem_wants_partner +
    pc.rem_wants_joint +
    pc.rem_savings_me +
    pc.rem_savings_partner +
    pc.rem_savings_joint +
    pc.rem_repay_me +
    pc.rem_repay_partner +
    pc.rem_repay_joint
  );
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export all user data as CSV
 */
export async function exportUserData(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: owned } = await supabase
    .from('households')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: partnerOf } = await supabase
    .from('households')
    .select('*')
    .eq('partner_user_id', user.id)
    .order('partner_accepted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const household = owned ?? partnerOf;
  if (!household) {
    throw new Error('No household found');
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'data_export',
    resource: 'privacy',
  });

  type HouseholdRow = { id: string; owner_id?: string; partner_name?: string | null; [k: string]: unknown };
  const h = household as HouseholdRow;
  const householdId = h.id;
  const mode = h.is_couple ? 'couple' : 'solo';

  let ownerDisplayName: string | null = null;
  if (h.owner_id) {
    const { data: ownerRow } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', h.owner_id)
      .single();
    ownerDisplayName = (ownerRow as { display_name: string | null } | null)?.display_name ?? null;
  }
  const ownerLabel = formatDisplayNameForLabel(ownerDisplayName, 'Account owner');
  const partnerLabel = formatDisplayNameForLabel(h.partner_name, 'Partner');

  const { data: paycycles } = await supabase
    .from('paycycles')
    .select('*')
    .eq('household_id', householdId)
    .order('start_date', { ascending: false });

  const paycycleList = (paycycles ?? []) as PaycycleRow[];
  const paycycleStartMap: Record<string, string> = {};
  paycycleList.forEach((pc) => {
    paycycleStartMap[pc.id] = pc.start_date;
  });

  const { data: seeds } = await supabase
    .from('seeds')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  const { data: pots } = await supabase
    .from('pots')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  const { data: repayments } = await supabase
    .from('repayments')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  const today = new Date().toISOString().split('T')[0];
  let csv = `PlotBudget Data Export\nExported: ${today}\n\n`;

  csv += `=== HOUSEHOLD ===\n`;
  csv += `Name,Mode,Partner Name,Created\n`;
  csv += `${escapeCsv(String(h.name ?? ''))},${mode},${escapeCsv(String(h.partner_name ?? ''))},${h.created_at ?? ''}\n\n`;

  csv += `=== PAYCYCLES ===\n`;
  csv += `Start Date,End Date,Status,Your Income,Partner Income,Allocated,Remaining\n`;
  paycycleList.forEach((pc) => {
    const remaining = paycycleRemaining(pc);
    csv += `${pc.start_date},${pc.end_date},${pc.status},${pc.snapshot_user_income},${pc.snapshot_partner_income},${pc.total_allocated},${remaining}\n`;
  });
  csv += `\n`;

  csv += `=== SEEDS ===\n`;
  csv += `Name,Category,Amount,Payment Source,Recurring,Paid,Paycycle Start,Created By\n`;
  (seeds ?? []).forEach((s: Record<string, unknown>) => {
    const paycycleStart = paycycleStartMap[s.paycycle_id as string] ?? '';
    const ps = s.payment_source as string | undefined;
    const paymentSourceLabel =
      ps === 'joint' ? 'JOINT' : ps === 'me' ? ownerLabel : ps === 'partner' ? partnerLabel : (ps ?? '').toUpperCase();
    const createdBy = s.created_by_owner ? ownerLabel : partnerLabel;
    csv += `${escapeCsv(String(s.name ?? ''))},${s.type ?? ''},${s.amount ?? 0},${escapeCsv(paymentSourceLabel)},${s.is_recurring ?? false},${s.is_paid ?? false},${paycycleStart},${escapeCsv(createdBy)}\n`;
  });
  csv += `\n`;

  csv += `=== POTS ===\n`;
  csv += `Name,Target Amount,Current Amount,Target Date,Status\n`;
  (pots ?? []).forEach((pot: Record<string, unknown>) => {
    csv += `${escapeCsv(String(pot.name ?? ''))},${pot.target_amount ?? 0},${pot.current_amount ?? 0},${pot.target_date ?? ''},${pot.status ?? ''}\n`;
  });
  csv += `\n`;

  csv += `=== REPAYMENTS ===\n`;
  csv += `Name,Starting Balance,Current Balance,Status\n`;
  (repayments ?? []).forEach((r: Record<string, unknown>) => {
    csv += `${escapeCsv(String(r.name ?? ''))},${r.starting_balance ?? 0},${r.current_balance ?? 0},${r.status ?? ''}\n`;
  });

  return csv;
}

/**
 * Delete user account and all associated data (GDPR).
 * Works for both owners and partners: partners are unlinked from household first, then user and auth are deleted.
 */
export async function deleteUserAccount() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'account_deleted',
    resource: 'account',
  });

  const admin = createAdminClient();
  const { data: ownedHousehold } = await supabase
    .from('households')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (ownedHousehold) {
    const { error: householdError } = await supabase
      .from('households')
      .delete()
      .eq('id', (ownedHousehold as { id: string }).id);

    if (householdError) {
      throw new Error('Failed to delete household data');
    }
  } else {
    // Partner: unlink from household so we can delete user row
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
      .eq('partner_user_id', user.id);
  }

  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id);

  if (userError) {
    throw new Error('Failed to delete user profile');
  }

  try {
    await admin.auth.admin.deleteUser(user.id);
  } catch (err) {
    console.error('Failed to delete auth user:', err);
  }

  await supabase.auth.signOut();
  redirect('/login?deleted=true');
}

/**
 * Change user password
 */
export async function changePassword(newPassword: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const validatedPassword = passwordSchema.parse(newPassword);

  const { error } = await supabase.auth.updateUser({
    password: validatedPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  await logAuditEvent({
    userId: user.id,
    eventType: 'password_change',
    resource: 'account',
  });

  revalidatePath('/dashboard/settings');
}
