import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Create a Supabase admin client (service role). Use only in server contexts.
 * Callers must pass URL and service role key (e.g. from env) so this package stays environment-agnostic.
 */
export function createAdminClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
