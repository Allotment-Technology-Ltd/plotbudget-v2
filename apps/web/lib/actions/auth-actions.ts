'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error('Failed to sign out');
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Signs out the partner (they have an account) and redirects to login. Use when partner clicks "Leave".
 */
export async function leavePartnerSession() {
  await signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
