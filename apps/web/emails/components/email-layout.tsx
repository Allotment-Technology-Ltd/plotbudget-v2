import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  children: React.ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={logo}>PLOT</Text>
          </Section>
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Questions? Just reply to this email or visit{' '}
            <a href="https://plotbudget.com/help" style={link}>
              plotbudget.com/help
            </a>
          </Text>
          <Text style={footer}>
            PLOT Team
            <br />
            hello@plotbudget.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: '#1a1a1a',
  margin: '20px 0',
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '26px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
};

const link = {
  color: '#556cd6',
  textDecoration: 'underline',
};
