import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';
import { getPartnerContext } from '@/lib/partner-context';

/**
 * Resolve household_id for the current user (owner or partner).
 * Use in API routes and server actions.
 */
export async function getHouseholdIdForUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', userId)
    .single()) as { data: { household_id: string | null } | null };
  if (profile?.household_id) return profile.household_id;
  const { householdId } = await getPartnerContext(supabase, userId);
  return householdId;
}
