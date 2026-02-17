import { Suspense } from 'react';
import { SignupHubClient } from '@/components/auth/signup-hub-client';

export const metadata = {
  title: 'Create account | PLOT',
  description: 'Create your PLOT account',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <SignupHubClient />
    </Suspense>
  );
}
