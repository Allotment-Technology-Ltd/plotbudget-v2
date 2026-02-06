'use server';

import { cookies } from 'next/headers';
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
 * Clears the partner session cookie and redirects to login. Use when partner clicks "Leave".
 */
export async function leavePartnerSession() {
  const cookieStore = await cookies();
  cookieStore.set('partner_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  revalidatePath('/', 'layout');
  redirect('/login');
}
