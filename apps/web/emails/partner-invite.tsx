import { Text, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './components/email-layout';
import { text, button, textSmall } from './styles';

interface PartnerInviteEmailProps {
  inviterEmail: string;
  joinUrl: string;
}

export default function PartnerInviteEmail({
  inviterEmail,
  joinUrl,
}: PartnerInviteEmailProps) {
  return (
    <EmailLayout>
      <Text style={text}>You&apos;ve been invited to join a household on PLOT Budget.</Text>
      <Text style={text}>
        Your partner ({inviterEmail}) wants to budget together — the 20-minute payday ritual that
        replaces every awkward money conversation.
      </Text>
      <Button href={joinUrl} style={button}>
        Accept invitation
      </Button>
      <Text style={text}>Or copy this link:</Text>
      <Text style={{ ...textSmall, wordBreak: 'break-all' as const }}>{joinUrl}</Text>
      <Text style={textSmall}>
        If you didn&apos;t expect this email, you can ignore it.
      </Text>
    </EmailLayout>
  );
}
