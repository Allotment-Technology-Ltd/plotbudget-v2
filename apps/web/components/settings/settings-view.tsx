'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HouseholdTab } from './household-tab';
import { IncomeSourcesTab } from './income-sources-tab';
import { PrivacyTab } from './privacy-tab';
import { ProfileTab } from './profile-tab';
import { SubscriptionTab } from './subscription-tab';
import type { IncomeSource } from '@/lib/supabase/database.types';

export interface SettingsViewProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl?: string | null;
    /** Human-readable sign-in method labels (e.g. "Google", "Email & password") for display in Profile. */
    signInMethodLabels?: string[];
    /** Founding Member: Premium free until this date. First 50 users. */
    foundingMemberUntil?: string | null;
    /** Trial cycles completed (trial = first 2). */
    trialCyclesCompleted?: number;
    /** Trial ended timestamp. */
    trialEndedAt?: string | null;
    /** Grace period start timestamp (7 days after trial). */
    gracePeriodStart?: string | null;
  };
  pricingEnabled?: boolean;
  subscription?: {
    status: 'active' | 'cancelled' | 'past_due' | 'trialing';
    current_tier: 'free' | 'pro' | null;
    trial_end_date: string | null;
    polar_product_id: string | null;
    metadata?: { pwyl_amount?: string; pricing_mode?: string } | null;
  } | null;
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
    currency?: 'GBP' | 'USD' | 'EUR';
    partner_email?: string | null;
    partner_invite_status?: 'none' | 'pending' | 'accepted';
    partner_invite_sent_at?: string | null;
    partner_accepted_at?: string | null;
    partner_last_login_at?: string | null;
  };
  incomeSources?: IncomeSource[];
  isPartner?: boolean;
  ownerLabel?: string;
  partnerLabel?: string;
  /** Open a specific tab from URL (e.g. ?tab=income) */
  initialTab?: string;
  /** Show portal error when returning from failed Polar session */
  portalError?: boolean;
}

export function SettingsView({
  user,
  household,
  incomeSources = [],
  subscription,
  isPartner = false,
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
  pricingEnabled = false,
  initialTab,
  portalError = false,
}: SettingsViewProps) {
  const validTabs = pricingEnabled
    ? ['profile', 'household', 'income', 'privacy', 'subscription']
    : ['profile', 'household', 'income', 'privacy'];
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

      {portalError && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            <strong>Portal Error:</strong> We couldn't open the subscription portal. Please try again.
          </p>
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full sm:inline-flex h-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          {pricingEnabled && <TabsTrigger value="subscription">Subscription</TabsTrigger>}
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6 mt-6">
          <ProfileTab
            user={user}
            isPartner={isPartner}
            householdId={household.id}
            signInMethodLabels={user.signInMethodLabels}
          />
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
              currency: household.currency,
            }}
            isPartner={isPartner}
          />
        </TabsContent>
        <TabsContent value="income" className="space-y-6 mt-6">
          <IncomeSourcesTab
            householdId={household.id}
            incomeSources={incomeSources}
            isPartner={isPartner}
            ownerLabel={ownerLabel}
            partnerLabel={partnerLabel}
            currency={household.currency}
          />
        </TabsContent>
        {pricingEnabled && (
          <TabsContent value="subscription" className="space-y-6 mt-6">
            <SubscriptionTab
              subscription={subscription ?? null}
              householdId={household.id}
              userId={user.id}
              foundingMemberUntil={user.foundingMemberUntil ?? null}
              trialCyclesCompleted={user.trialCyclesCompleted ?? 0}
              trialEndedAt={user.trialEndedAt ?? null}
              gracePeriodStart={user.gracePeriodStart ?? null}
            />
          </TabsContent>
        )}
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <PrivacyTab userId={user.id} isPartner={isPartner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
