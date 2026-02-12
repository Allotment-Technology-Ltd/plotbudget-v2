'use client';

import * as React from 'react';
import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';

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
      <Heading style={h1}>Your PLOT trial ends soon</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your trial will end in about {daysRemaining} days{trialEndsOn ? ` (around ${trialEndsOn})` : ''}. After that
        you can stay on Free tier (limited pots) or upgrade to Premium (pay what you like, from £0/month).
      </Text>

      <Section style={list}>
        <Text style={listItem}>✓ Trial status: ending soon</Text>
        <Text style={listItem}>✓ Free tier limits: {freeTierLimits.pots} pots, {freeTierLimits.repayments} repayments</Text>
        <Text style={listItem}>✓ Premium: unlimited, pay what you want (£0-£10/month)</Text>
      </Section>

      {(overPots > 0 || overRepay > 0) && (
        <Section style={warningBox}>
          <Text style={warningTitle}>Action needed</Text>
          {overPots > 0 && (
            <Text style={textSmall}>You have {overPots} more savings pots than the free limit of {freeTierLimits.pots}.</Text>
          )}
          {overRepay > 0 && (
            <Text style={textSmall}>You have {overRepay} more repayments than the free limit of {freeTierLimits.repayments}.</Text>
          )}
          <Text style={textSmall}>Choose to reduce to free limits or upgrade to keep everything.</Text>
        </Section>
      )}

      <Button href="https://app.plotbudget.com/pricing" style={buttonPrimary}>
        View Pay-What-You-Like Pricing
      </Button>
      <Button href="https://app.plotbudget.com/dashboard/blueprint" style={buttonSecondary}>
        Reduce to Free Tier Limits
      </Button>
    </EmailLayout>
  );
}

const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold', margin: '20px 0' };
const text = { color: '#404040', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const textSmall = { color: '#404040', fontSize: '14px', lineHeight: '20px', margin: '8px 0' };
const list = { margin: '16px 0' };
const listItem = { color: '#404040', fontSize: '16px', lineHeight: '24px', margin: '8px 0' };
const warningBox = { backgroundColor: '#fff6e5', borderRadius: '8px', padding: '12px', margin: '16px 0', border: '1px solid #f6d7a8' };
const warningTitle = { color: '#8a5b00', fontSize: '15px', fontWeight: 'bold', margin: '4px 0' };
const buttonPrimary = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '20px 0 10px',
};
const buttonSecondary = {
  backgroundColor: '#fff',
  borderRadius: '6px',
  border: '1px solid #000',
  color: '#000',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 0 20px',
};
