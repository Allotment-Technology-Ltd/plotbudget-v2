import * as React from 'react';
import { Heading, Text, Button, Section } from '@react-email/components';
import { EmailLayout } from '../components/email-layout';
import { h1, text, list, listItem, button } from '../styles';

interface TrialMilestoneEmailProps {
  displayName: string;
  cyclesCompleted: number; // expect 1
  totalCycles: number; // expect 2
  nextCycleEndsOn?: string | null;
}

export default function TrialMilestoneEmail({
  displayName = 'there',
  cyclesCompleted = 1,
  totalCycles = 2,
  nextCycleEndsOn,
}: TrialMilestoneEmailProps) {
  return (
    <EmailLayout>
      <Heading style={h1}>One pay cycle down</Heading>
      <Text style={text}>Hi {displayName},</Text>
      <Text style={text}>
        You just completed pay cycle {cyclesCompleted} of {totalCycles} in your trial — one step closer to your full payday ritual.
      </Text>
      {nextCycleEndsOn && (
        <Text style={text}>Your next cycle is expected to end on {nextCycleEndsOn}.</Text>
      )}
      <Section style={list}>
        <Text style={listItem}>✓ Trial progress: {cyclesCompleted} of {totalCycles}</Text>
        <Text style={listItem}>✓ All premium features remain active during trial</Text>
      </Section>
      <Text style={text}>
        After your next pay cycle, you can stay on Free (limited pots) or upgrade to Premium to keep your full ritual — you choose what to pay.
      </Text>
      <Button href="https://app.plotbudget.com/pricing" style={button}>
        View Pricing Options
      </Button>
    </EmailLayout>
  );
}

