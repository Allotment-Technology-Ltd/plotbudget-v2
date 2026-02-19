/**
 * Admin and trial-testing access.
 * Use in server code only (layout, API routes).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';

/**
 * True when the current user is allowed to access the admin section (is_admin in users).
 * Call from server (layout, RSC). Returns false when not authenticated or not admin.
 */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: row } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  return (row as { is_admin?: boolean } | null)?.is_admin === true;
}

/**
 * True when trial email testing is allowed: either pre-production (env/branch) OR current user is admin.
 * Use in dev/trial API routes so admins can use email testing in production.
 */
export async function allowTrialTestingOrAdmin(): Promise<boolean> {
  if (isTrialTestingDashboardAllowed()) return true;
  return isAdminUser();
}
