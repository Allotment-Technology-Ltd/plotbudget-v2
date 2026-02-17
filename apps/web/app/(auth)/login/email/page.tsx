import { Suspense } from 'react';
import { LoginEmailClient } from '@/components/auth/login-email-client';

export const metadata = {
  title: 'Sign in with email | PLOT',
  description: 'Sign in to your PLOT account with email and password',
};

export default function LoginEmailPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <LoginEmailClient />
    </Suspense>
  );
}
