import { Html, Head, Body, Container, Section, Text, Hr } from '@react-email/components';
import * as React from 'react';
import {
  main,
  container,
  logo,
  hr,
  footer,
  link,
} from '../styles';

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
