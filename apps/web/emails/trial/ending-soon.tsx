'use client';

import * as React from 'react';
import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';
import {
  h1,
  text,
  textSmall,
  list,
  listItem,
  warningBox,
  warningTitle,
  button,
  buttonSecondary,
} from '../styles';

interface TrialEndingSoonEmailProps {
  displayName: string;
  daysRemaining: number; // typically 3
  trialEndsOn?: string | null;
  currentCounts?: {
    pots?: number;
    repayments?: number;
    needs?: number;
    wants?: number;
  };
  freeTierLimits?: {
    pots: number;
    repayments: number;
    needs: number;
    wants: number;
  };
}

export default function TrialEndingSoonEmail({
  displayName = 'there',
  daysRemaining = 3,
  trialEndsOn,
  currentCounts,
  freeTierLimits = { pots: 2, repayments: 2, needs: 5, wants: 5 },
}: TrialEndingSoonEmailProps) {
  const overPots = Math.max(0, (currentCounts?.pots ?? 0) - freeTierLimits.pots);
  const overRepay = Math.max(0, (currentCounts?.repayments ?? 0) - freeTierLimits.repayments);

  return (
    <EmailLayout>
      <Heading style={h1}>Your trial is ending soon</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your trial ends in about {daysRemaining} days{trialEndsOn ? ` (around ${trialEndsOn})` : ''}. After that,
        you can stay on Free tier (limited pots) or upgrade to Premium to keep your full payday ritual (pay what you like, from £0/month).
      </Text>

      <Section style={list}>
        <Text style={listItem}>✓ Trial status: ending soon</Text>
        <Text style={listItem}>✓ Free tier limits: {freeTierLimits.pots} pots, {freeTierLimits.repayments} repayments</Text>
        <Text style={listItem}>✓ Premium: unlimited, pay what you want (£0-£10/month)</Text>
      </Section>

      {(overPots > 0 || overRepay > 0) && (
        <Section style={warningBox}>
          <Text style={warningTitle}>Heads up</Text>
          {overPots > 0 && (
            <Text style={textSmall}>You have {overPots} more savings pots than the free limit of {freeTierLimits.pots}.</Text>
          )}
          {overRepay > 0 && (
            <Text style={textSmall}>You have {overRepay} more repayments than the free limit of {freeTierLimits.repayments}.</Text>
          )}
          <Text style={textSmall}>Choose to reduce to free limits or upgrade to keep everything.</Text>
        </Section>
      )}

      <Button href="https://app.plotbudget.com/pricing" style={button}>
        View Pay-What-You-Like Pricing
      </Button>
      <Button href="https://app.plotbudget.com/dashboard/blueprint" style={buttonSecondary}>
        Reduce to Free Tier Limits
      </Button>
    </EmailLayout>
  );
}

