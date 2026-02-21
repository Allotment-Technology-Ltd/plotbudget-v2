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

  const { data: ownedHousehold } = (await supabase
    .from('households')
    .select('id')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };
  if (ownedHousehold?.id) {
    await supabase
      .from('users')
      .update({ household_id: ownedHousehold.id } as never)
      .eq('id', userId);
    return ownedHousehold.id;
  }

  const { householdId } = await getPartnerContext(supabase, userId);
  if (householdId) {
    await supabase
      .from('users')
      .update({
        household_id: householdId,
        has_completed_onboarding: true,
      } as never)
      .eq('id', userId);
  }
  return householdId;
}
