import { Suspense } from 'react';
import { SignupPageClient } from '@/components/auth/signup-page-client';

export const metadata = {
  title: 'Sign up | PLOT',
  description: 'Create your PLOT account',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <SignupPageClient />
    </Suspense>
  );
}
