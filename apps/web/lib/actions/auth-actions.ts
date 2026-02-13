'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { leaveHouseholdAsPartner } from '@/app/actions/partner-invite';
import { logAuditEvent } from '@/lib/audit';

/**
 * Signs out the current user. Caller should redirect and show toast on success.
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: true };
  }

  await logAuditEvent({
    userId: session.user.id,
    eventType: 'logout',
    resource: 'auth',
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error('Failed to sign out');
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Partner leaves the household (unlinks from it) then signs out and redirects to login.
 * Use when partner clicks "Leave". They can be re-invited and sign in to rejoin.
 */
export async function leavePartnerSession() {
  await leaveHouseholdAsPartner();
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
