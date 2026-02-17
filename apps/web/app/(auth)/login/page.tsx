import { Suspense } from 'react';
import { LoginHubClient } from '@/components/auth/login-hub-client';

export const metadata = {
  title: 'Sign in | PLOT',
  description: 'Sign in to your PLOT account',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <LoginHubClient />
    </Suspense>
  );
}
