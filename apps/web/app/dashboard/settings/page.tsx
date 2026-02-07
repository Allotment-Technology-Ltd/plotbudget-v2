import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAvatarEnabledFromEnv } from '@/lib/feature-flags';
import { backfillIncomeSourcesFromOnboarding } from '@/lib/actions/income-source-actions';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = {
  title: 'Settings | PLOT',
  description: 'Account and household settings',
};

type HouseholdRow = {
  id: string;
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
};

const householdSelect =
  'id, name, is_couple, partner_name, partner_income, needs_percent, wants_percent, savings_percent, repay_percent, partner_email, partner_invite_status, partner_invite_sent_at, partner_accepted_at, partner_last_login_at';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const params = await searchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const email = user.email ?? '';
  type ProfileRow = { display_name: string | null; avatar_url: string | null };
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  const profileRow = profile as ProfileRow | null;
  const displayName = profileRow?.display_name ?? null;
  const avatarUrl = profileRow?.avatar_url ?? null;

  const { data: owned } = await supabase
    .from('households')
    .select(householdSelect)
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: partnerOf } = await supabase
    .from('households')
    .select(householdSelect)
    .eq('partner_user_id', user.id)
    .maybeSingle();

  const isPartner = !owned && !!partnerOf;
  const household = (owned ?? partnerOf) as HouseholdRow | null;

  if (!household) redirect('/onboarding');

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

  const avatarEnabled = getAvatarEnabledFromEnv();

  return (
    <div className="content-wrapper section-padding">
      <SettingsView
        user={{
          id: user.id,
          email,
          displayName,
          avatarUrl,
        }}
        avatarEnabled={avatarEnabled}
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
        }}
        incomeSources={incomeSources}
        isPartner={isPartner}
        initialTab={params.tab}
      />
    </div>
  );
}
