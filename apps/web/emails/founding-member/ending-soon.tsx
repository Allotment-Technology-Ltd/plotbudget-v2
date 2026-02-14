import * as React from 'react';
import { Heading, Text, Button } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';
import { h1, text, textSmall, button, buttonSecondary } from '../styles';

interface FoundingMemberEndingSoonEmailProps {
  displayName: string;
  foundingMemberEndsOn: string;
}

export default function FoundingMemberEndingSoonEmail({
  displayName = 'there',
  foundingMemberEndsOn,
}: FoundingMemberEndingSoonEmailProps) {
  return (
    <EmailLayout>
      <Heading style={h1}>Your Founding Member period ends soon</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your Founding Member Premium access ends on {foundingMemberEndsOn}. After
        that, you can continue with Free tier (limited pots) or upgrade to
        Premium — you choose what to pay.
      </Text>

      <Text style={text}>
        We&apos;ve loved having you as a Founding Member. If you want to keep
        unlimited pots and full access, upgrade anytime before or after the
        period ends.
      </Text>

      <Button href="https://app.plotbudget.com/pricing" style={button}>
        View Pay-What-You-Like Pricing
      </Button>
      <Button
        href="https://app.plotbudget.com/dashboard/settings"
        style={buttonSecondary}
      >
        Manage Subscription
      </Button>

      <Text style={textSmall}>
        Your data stays safe. Upgrade anytime to restore full access.
      </Text>
    </EmailLayout>
  );
}
