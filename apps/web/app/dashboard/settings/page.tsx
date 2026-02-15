import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatDisplayNameForLabel } from '@/lib/utils/display-name';
import { getPaymentUiVisibleFromServerFlags } from '@/lib/feature-flags';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';
import { backfillIncomeSourcesFromOnboarding } from '@/lib/actions/income-source-actions';
import { getSignInMethodLabels } from '@/lib/auth/sign-in-methods';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = {
  title: 'Settings | PLOT',
  description: 'Account and household settings',
};

type HouseholdRow = {
  id: string;
  owner_id?: string;
  name: string | null;
  is_couple: boolean;
  partner_name: string | null;
  partner_income: number;
  needs_percent: number;
  wants_percent: number;
  savings_percent: number;
  repay_percent: number;
  partner_email: string | null;
  partner_invite_status: 'none' | 'pending' | 'accepted';
  partner_invite_sent_at: string | null;
  partner_accepted_at: string | null;
  partner_last_login_at: string | null;
  currency: 'GBP' | 'USD' | 'EUR';
  founding_member_until: string | null;
};

type SubscriptionRow = {
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_tier: 'free' | 'pro' | null;
  trial_end_date: string | null;
  polar_product_id: string | null;
  metadata?: { pwyl_amount?: string; pricing_mode?: string } | null;
};

const householdSelect =
  'id, owner_id, name, is_couple, partner_name, partner_income, needs_percent, wants_percent, savings_percent, repay_percent, partner_email, partner_invite_status, partner_invite_sent_at, partner_accepted_at, partner_last_login_at, currency';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; portal_error?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const flags = await getServerFeatureFlags(user.id);
  const paymentUiVisible = getPaymentUiVisibleFromServerFlags(flags);

  const email = user.email ?? '';

  // Linked sign-in methods (Google, Apple, email, etc.) for display in Profile
  let signInMethodLabels: string[] = [];
  try {
    const auth = supabase.auth as { getUserIdentities?: () => Promise<{ data?: { identities?: { provider: string }[] } }> };
    const result = auth.getUserIdentities ? await auth.getUserIdentities() : null;
    const identities = result?.data?.identities ?? [];
    const providers = identities.map((i) => i.provider).filter(Boolean);
    signInMethodLabels = getSignInMethodLabels(providers);
  } catch {
    // Fallback: use single provider from app_metadata if getUserIdentities unavailable
    const p = (user.app_metadata as { provider?: string } | undefined)?.provider;
    if (p) signInMethodLabels = getSignInMethodLabels([p]);
  }

  type ProfileRow = {
    display_name: string | null;
    avatar_url: string | null;
    founding_member_until: string | null;
    trial_cycles_completed: number;
    trial_ended_at: string | null;
    grace_period_start: string | null;
  };
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url, founding_member_until, trial_cycles_completed, trial_ended_at, grace_period_start')
    .eq('id', user.id)
    .maybeSingle();
  const profileRow = profile as ProfileRow | null;
  const displayName = profileRow?.display_name ?? null;
  const avatarUrl = profileRow?.avatar_url ?? null;
  const foundingMemberUntil = profileRow?.founding_member_until ?? null;
  const trialCyclesCompleted = profileRow?.trial_cycles_completed ?? 0;
  const trialEndedAt = profileRow?.trial_ended_at ?? null;
  const gracePeriodStart = profileRow?.grace_period_start ?? null;

  const { data: owned } = await supabase
    .from('households')
    .select(`${householdSelect}, founding_member_until`)
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: partnerOf } = await supabase
    .from('households')
    .select(`${householdSelect}, founding_member_until`)
    .eq('partner_user_id', user.id)
    .maybeSingle();

  const isPartner = !owned && !!partnerOf;
  const household = (owned ?? partnerOf) as HouseholdRow | null;

  if (!household) redirect('/onboarding');

  let ownerDisplayName: string | null = null;
  if (household.owner_id) {
    const { data: ownerRow } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', household.owner_id)
      .single();
    ownerDisplayName = (ownerRow as { display_name: string | null } | null)?.display_name ?? null;
  }
  const ownerLabel = formatDisplayNameForLabel(ownerDisplayName, 'Account owner');
  const partnerLabel = formatDisplayNameForLabel(household.partner_name, 'Partner');

  let incomeSourcesData = await supabase
    .from('income_sources')
    .select('*')
    .eq('household_id', household.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  let incomeSources = (incomeSourcesData.data ?? []) as {
    id: string;
    household_id: string;
    name: string;
    amount: number;
    frequency_rule: 'specific_date' | 'last_working_day' | 'every_4_weeks';
    day_of_month: number | null;
    anchor_date: string | null;
    payment_source: 'me' | 'partner' | 'joint';
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }[];

  if (incomeSources.length === 0) {
    const backfill = await backfillIncomeSourcesFromOnboarding(household.id);
    if (backfill.created > 0) {
      const refetch = await supabase
        .from('income_sources')
        .select('*')
        .eq('household_id', household.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      incomeSources = (refetch.data ?? []) as typeof incomeSources;
    }
  }

  // Fetch subscription when payment/pricing UI is visible (state 2 or 3)
  let subscription: SubscriptionRow | null = null;
  if (paymentUiVisible) {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status, current_tier, trial_end_date, polar_product_id, metadata')
      .eq('household_id', household.id)
      .maybeSingle();
    subscription = subData as SubscriptionRow | null;
  }

  return (
    <div className="content-wrapper section-padding">
      <SettingsView
        user={{
          id: user.id,
          email,
          displayName: displayName ?? (isPartner ? household.partner_name : null),
          avatarUrl,
          signInMethodLabels,
          foundingMemberUntil,
          trialCyclesCompleted,
          trialEndedAt,
          gracePeriodStart,
        }}
        pricingEnabled={paymentUiVisible}
        subscription={subscription}
        household={{
          id: household.id,
          name: household.name,
          is_couple: household.is_couple,
          partner_name: household.partner_name,
          partner_income: household.partner_income,
          needs_percent: household.needs_percent,
          wants_percent: household.wants_percent,
          savings_percent: household.savings_percent,
          repay_percent: household.repay_percent,
          partner_email: household.partner_email,
          partner_invite_status: household.partner_invite_status,
          partner_invite_sent_at: household.partner_invite_sent_at,
          partner_accepted_at: household.partner_accepted_at,
          partner_last_login_at: household.partner_last_login_at,
          currency: household.currency,
          foundingMemberUntil: household.founding_member_until,
        }}
        incomeSources={incomeSources}
        isPartner={isPartner}
        ownerLabel={ownerLabel}
        partnerLabel={partnerLabel}
        initialTab={params.tab}
        portalError={params.portal_error === 'true'}
      />
    </div>
  );
}
