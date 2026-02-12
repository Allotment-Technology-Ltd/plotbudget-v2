'use client';

import * as React from 'react';
import { Heading, Text, Button } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';

interface GraceReminderEmailProps {
  displayName: string;
  graceDay?: number; // default 6 (day 6 of 7)
}

export default function GraceReminderEmail({ displayName = 'there', graceDay = 6 }: GraceReminderEmailProps) {
  return (
    <EmailLayout>
      <Heading style={h1}>Final reminder: reduce or upgrade</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your trial ended and you’re in the 7-day grace period. This is day {graceDay}. Tomorrow, we’ll archive any items over the Free tier limits unless you reduce or upgrade.
      </Text>

      <Button href="https://app.plotbudget.com/pricing" style={buttonPrimary}>
        Upgrade with Pay-What-You-Like
      </Button>
      <Button href="https://app.plotbudget.com/dashboard/blueprint" style={buttonSecondary}>
        Reduce to Free Tier Limits
      </Button>

      <Text style={textSmall}>
        Archiving is reversible: your data is safe. Upgrade anytime to restore everything instantly.
      </Text>
    </EmailLayout>
  );
}

const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold', margin: '20px 0' };
const text = { color: '#404040', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const textSmall = { color: '#404040', fontSize: '14px', lineHeight: '20px', margin: '12px 0' };
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
