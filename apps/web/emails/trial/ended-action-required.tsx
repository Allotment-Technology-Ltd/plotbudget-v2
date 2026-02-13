import * as React from 'react';
import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';
import {
  h1,
  text,
  textSmall,
  warningBox,
  warningTitle,
  button,
  buttonSecondary,
} from '../styles';

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
      <Heading style={h1}>Your trial has ended — what happens next</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        Your PLOT trial has ended. You’re currently over the Free tier limits. To keep all your pots, upgrade to Premium (you choose what to pay) or reduce to Free limits within {graceDays} days.
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

      <Button href="https://app.plotbudget.com/pricing" style={button}>
        Upgrade with Pay-What-You-Like
      </Button>
      <Button href="https://app.plotbudget.com/dashboard/blueprint" style={buttonSecondary}>
        Reduce to Free Tier Limits
      </Button>
    </EmailLayout>
  );
}

