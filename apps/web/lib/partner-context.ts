import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

/**
 * Resolve partner context from DB: is this user the partner of a household?
 * Use in server components/actions when the user is authenticated (partners
 * now have accounts). Returns householdId when user is partner_user_id of a household.
 */
export async function getPartnerContext(
  supabase: SupabaseClient<Database>,
  userId: string | null
): Promise<{
  householdId: string | null;
  isPartner: boolean;
}> {
  if (!userId) return { householdId: null, isPartner: false };

  const { data } = await supabase
    .from('households')
    .select('id')
    .eq('partner_user_id', userId)
    .maybeSingle();

  const row = data as { id: string } | null;
  return {
    householdId: row?.id ?? null,
    isPartner: !!row?.id,
  };
}
