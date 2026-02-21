import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * React's cache() is request-scoped: it is invalidated for each server request.
 * Results are never shared across requests, so auth/profile data cannot leak between users.
 * @see https://react.dev/reference/react/cache
 */

/** Request-scoped Supabase client. Deduplicated per RSC request so layout + page share one client. */
export const getCachedSupabase = cache(createServerSupabaseClient);

type DashboardProfile = {
  display_name: string | null;
  avatar_url: string | null;
  household_id: string | null;
  current_paycycle_id: string | null;
  has_completed_onboarding: boolean;
  is_admin: boolean;
} | null;

type OwnedHousehold = { id: string } | null;
type PartnerHousehold = { id: string; partner_name: string | null } | null;

/**
 * Auth + profile + household ownership for dashboard in one deduplicated call.
 * Layout and all dashboard pages can call this; only the first call in a request runs the fetches.
 * Cache is request-scoped (React cache()); no cross-request sharing of auth data.
 */
export const getCachedDashboardAuth = cache(async (): Promise<{
  user: User | null;
  profile: DashboardProfile;
  owned: OwnedHousehold;
  partnerOf: PartnerHousehold;
  isAdmin: boolean;
}> => {
  const supabase = await getCachedSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, profile: null, owned: null, partnerOf: null, isAdmin: false };
  }

  const profileSelect =
    'display_name, avatar_url, household_id, current_paycycle_id, has_completed_onboarding, is_admin';

  const [profileRes, ownedRes, partnerOfRes] = await Promise.all([
    supabase
      .from('users')
      .select(profileSelect)
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('households')
      .select('id, partner_name')
      .eq('partner_user_id', user.id)
      .order('partner_accepted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let profile = profileRes.data as DashboardProfile;
  const owned = ownedRes.data as OwnedHousehold;
  const partnerOf = partnerOfRes.data as PartnerHousehold;
  const resolvedHouseholdId = profile?.household_id ?? owned?.id ?? partnerOf?.id ?? null;

  if (!profile) {
    await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email ?? `${user.id}@plot.invalid`,
        } as never,
        { onConflict: 'id' }
      );
    const { data: repairedProfile } = await supabase
      .from('users')
      .select(profileSelect)
      .eq('id', user.id)
      .maybeSingle();
    profile = repairedProfile as DashboardProfile;
  }

  if (resolvedHouseholdId && profile && !profile.household_id) {
    await supabase
      .from('users')
      .update({ household_id: resolvedHouseholdId } as never)
      .eq('id', user.id);
    profile = { ...profile, household_id: resolvedHouseholdId };
  }

  if (partnerOf && profile && !profile.has_completed_onboarding) {
    await supabase
      .from('users')
      .update({ has_completed_onboarding: true } as never)
      .eq('id', user.id);
    profile = { ...profile, has_completed_onboarding: true };
  }

  const isAdmin = profile?.is_admin === true;

  return { user, profile, owned, partnerOf, isAdmin };
});

/**
 * True when the household's active pay cycle has ended (end_date is in the past).
 * Used to redirect to the payday-complete ritual so the user can start the new cycle.
 * Closing the cycle (ritual_closed_at) only locks the current cycle; the new cycle
 * does not begin until the current cycle's end_date has passed.
 */
export const getPaydayCompleteRequired = cache(async (householdId: string): Promise<boolean> => {
  const supabase = await getCachedSupabase();
  const { data } = await supabase
    .from('paycycles')
    .select('id, end_date')
    .eq('household_id', householdId)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return false;
  const row = data as { id: string; end_date: string };
  const today = new Date().toISOString().slice(0, 10);
  return row.end_date < today;
});

export type { DashboardProfile, OwnedHousehold, PartnerHousehold };
