import { Heading, Text, Button, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from '../components/email-layout';
import { h1, text, button, list, listItem } from '../styles';

interface PWYLWelcomeEmailProps {
  displayName: string;
  amount: number;
}

export default function PWYLWelcomeEmail({ displayName = 'there', amount = 3 }: PWYLWelcomeEmailProps) {
  const isFree = amount === 0;
  
  return (
    <EmailLayout>
      <Heading style={h1}>Welcome to PLOT Premium!</Heading>
      
      <Text style={text}>Hi {displayName},</Text>
      
      {isFree ? (
        <>
          <Text style={text}>
            You're now using PLOT Premium as a <strong>Community Supporter</strong> at no cost.
            Thank you for being part of our community!
          </Text>
        </>
      ) : (
        <>
          <Text style={text}>
            Thank you for supporting PLOT — your contribution helps us build a better product for everyone.
          </Text>
        </>
      )}
      
      <Text style={text}>Your payday ritual just got an upgrade — everything you need to plan together:</Text>
      
      <Section style={list}>
        <Text style={listItem}>✓ Unlimited bills and wants</Text>
        <Text style={listItem}>✓ Unlimited savings pots</Text>
        <Text style={listItem}>✓ Unlimited repayments</Text>
      </Section>
      
      <Button
        href="https://app.plotbudget.com/dashboard/settings?tab=subscription"
        style={button}
      >
        Manage Subscription
      </Button>
      
      <Text style={text}>
        You can change your contribution amount or cancel anytime through Settings.
      </Text>
    </EmailLayout>
  );
}
