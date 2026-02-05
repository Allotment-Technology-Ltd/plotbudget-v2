'use server';

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
