import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient as createAdminClientFromPackage } from '@repo/supabase';
import type { Database } from '@repo/supabase';

// Admin client for server-side operations that bypass RLS
// Only use in API routes and server actions where elevated privileges are needed
export function createAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createAdminClientFromPackage(supabaseUrl, serviceRoleKey) as SupabaseClient<Database>;
}
