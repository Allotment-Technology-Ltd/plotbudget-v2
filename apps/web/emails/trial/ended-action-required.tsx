'use client';

import * as React from 'react';
import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';

interface TrialEndedActionRequiredEmailProps {
  displayName: string;
  overPots?: number;
  overRepayments?: number;
  graceDays?: number; // default 7
}

export default function TrialEndedActionRequiredEmail({
  displayName = 'there',
  overPots = 0,
  overRepayments = 0,
  graceDays = 7,
}: TrialEndedActionRequiredEmailProps) {
  return (
    <EmailLayout>
      <Heading style={h1}>Your trial has ended - action needed</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your PLOT trial has ended. You’re currently over the Free tier limits. To keep all your pots, upgrade to Premium (pay what you like, from £0/month) or reduce to Free limits within {graceDays} days.
      </Text>

      <Section style={warningBox}>
        <Text style={warningTitle}>Over free limits:</Text>
        {overPots > 0 && (
          <Text style={textSmall}>Savings pots over limit: {overPots}</Text>
        )}
        {overRepayments > 0 && (
          <Text style={textSmall}>Repayments over limit: {overRepayments}</Text>
        )}
        {(overPots === 0 && overRepayments === 0) && (
          <Text style={textSmall}>You’re within limits, but can upgrade anytime.</Text>
        )}
        <Text style={textSmall}>After {graceDays} days, excess items will be archived (not deleted). Upgrade anytime to restore them instantly.</Text>
      </Section>

      <Button href="https://app.plotbudget.com/pricing" style={buttonPrimary}>
        Upgrade with PWYL (from £0/month)
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
