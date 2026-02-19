import { Html, Head, Body, Container, Section, Text, Hr, Img } from '@react-email/components';
import * as React from 'react';
import {
  main,
  container,
  logoContainer,
  logoImage,
  logoText,
  hr,
  footer,
  link,
} from '../styles';

/** Public URL for email logo (must be absolute for email clients). */
const EMAIL_LOGO_URL = 'https://app.plotbudget.com/logo-email.svg';

interface EmailLayoutProps {
  children: React.ReactNode;
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src={EMAIL_LOGO_URL}
              alt="PLOT"
              width={40}
              height={40}
              style={logoImage}
            />
            <Text style={logoText}>PLOT</Text>
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
