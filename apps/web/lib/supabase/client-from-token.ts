import { createClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

/**
 * Create a Supabase client authenticated with a user's JWT.
 * Used by API routes called from native app (no cookies).
 */
export function createSupabaseClientFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient<Database>(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
