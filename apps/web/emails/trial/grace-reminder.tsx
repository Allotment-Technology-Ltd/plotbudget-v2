import * as React from 'react';
import { Heading, Text, Button } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';
import { h1, text, textSmall, button, buttonSecondary } from '../styles';

interface GraceReminderEmailProps {
  displayName: string;
  graceDay?: number; // default 6 (day 6 of 7)
}

export default function GraceReminderEmail({ displayName = 'there', graceDay = 6 }: GraceReminderEmailProps) {
  return (
    <EmailLayout>
      <Heading style={h1}>Your grace period ends tomorrow</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your trial ended and you’re in the 7-day grace period. This is day {graceDay}. Tomorrow, we’ll archive any items over the Free tier limits unless you reduce or upgrade.
      </Text>

      <Button href="https://app.plotbudget.com/pricing" style={button}>
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

