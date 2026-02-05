import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata: Metadata = {
  title: 'Settings | PLOT',
  description: 'Account and household settings',
};

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  type ProfileRow = { display_name: string | null };
  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  const displayName = (profile as ProfileRow | null)?.display_name ?? null;

  const { data: household } = await supabase
    .from('households')
    .select(
      'id, name, is_couple, partner_name, partner_income, needs_percent, wants_percent, savings_percent, repay_percent'
    )
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!household) {
    redirect('/onboarding');
  }

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
  };
  const h = household as HouseholdRow;

  return (
    <div className="content-wrapper section-padding">
      <SettingsView
        user={{
          id: user.id,
          email: user.email ?? '',
          displayName,
        }}
        household={{
          id: h.id,
          name: h.name,
          is_couple: h.is_couple,
          partner_name: h.partner_name,
          partner_income: h.partner_income,
          needs_percent: h.needs_percent,
          wants_percent: h.wants_percent,
          savings_percent: h.savings_percent,
          repay_percent: h.repay_percent,
        }}
      />
    </div>
  );
}
