'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedTab } from './advanced-tab';
import { HouseholdTab } from './household-tab';
import { IncomeSourcesTab } from './income-sources-tab';
import { PrivacyTab } from './privacy-tab';
import { ProfileTab } from './profile-tab';
import type { IncomeSource } from '@/lib/supabase/database.types';

export interface SettingsViewProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl?: string | null;
  };
  avatarEnabled?: boolean;
  household: {
    id: string;
    name: string | null;
    is_couple: boolean;
    partner_name: string | null;
    partner_income: number;
    needs_percent: number;
    wants_percent: number;
    savings_percent: number;
    repay_percent: number;
    partner_email?: string | null;
    partner_invite_status?: 'none' | 'pending' | 'accepted';
    partner_invite_sent_at?: string | null;
    partner_accepted_at?: string | null;
    partner_last_login_at?: string | null;
  };
  incomeSources?: IncomeSource[];
  isPartner?: boolean;
  /** When true, show Subscription tab (and pass subscription data). */
  pricingEnabled?: boolean;
  subscription?: {
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    current_tier: 'free' | 'pro' | null;
    trial_end_date: string | null;
    polar_product_id: string | null;
  } | null;
  /** Open a specific tab from URL (e.g. ?tab=income) */
  initialTab?: string;
}

export function SettingsView({
  user,
  household,
  incomeSources = [],
  isPartner = false,
  avatarEnabled = false,
  pricingEnabled = false,
  initialTab,
}: SettingsViewProps) {
  const validTabs = pricingEnabled
    ? ['profile', 'household', 'income', 'privacy', 'advanced', 'subscription']
    : ['profile', 'household', 'income', 'privacy', 'advanced'];
  const defaultTab =
    initialTab && validTabs.includes(initialTab) ? initialTab : 'profile';

  return (
    <div className="max-w-4xl mx-auto" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase text-foreground mb-2">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and household preferences.
        </p>
      </div>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full sm:inline-flex h-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          {pricingEnabled && <TabsTrigger value="subscription">Subscription</TabsTrigger>}
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          {!isPartner && <TabsTrigger value="advanced">Advanced</TabsTrigger>}
        </TabsList>
        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileTab user={user} isPartner={isPartner} avatarEnabled={avatarEnabled} />
        </TabsContent>
        <TabsContent value="household" className="space-y-6 mt-6">
          <HouseholdTab
            household={{
              id: household.id,
              name: household.name,
              is_couple: household.is_couple,
              partner_name: household.partner_name,
              partner_income: household.partner_income,
              partner_email: household.partner_email,
              partner_invite_status: household.partner_invite_status,
              partner_invite_sent_at: household.partner_invite_sent_at,
              partner_accepted_at: household.partner_accepted_at,
              partner_last_login_at: household.partner_last_login_at,
            }}
            isPartner={isPartner}
          />
        </TabsContent>
        <TabsContent value="income" className="space-y-6 mt-6">
          <IncomeSourcesTab
            householdId={household.id}
            incomeSources={incomeSources}
            isPartner={isPartner}
          />
        </TabsContent>
        {pricingEnabled && (
          <TabsContent value="subscription" className="space-y-6 mt-6">
            <p className="text-sm text-muted-foreground">Subscription details will appear here when the Subscription tab component is available.</p>
          </TabsContent>
        )}
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <PrivacyTab userId={user.id} isPartner={isPartner} />
        </TabsContent>
        {!isPartner && (
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <AdvancedTab
              categoryRatios={{
                needs: household.needs_percent,
                wants: household.wants_percent,
                savings: household.savings_percent,
                repay: household.repay_percent,
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
