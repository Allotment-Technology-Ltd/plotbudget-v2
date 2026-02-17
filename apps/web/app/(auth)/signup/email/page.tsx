import { Suspense } from 'react';
import { SignupEmailClient } from '@/components/auth/signup-email-client';

export const metadata = {
  title: 'Sign up with email | PLOT',
  description: 'Create your PLOT account with email and password',
};

export default function SignupEmailPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <SignupEmailClient />
    </Suspense>
  );
}
