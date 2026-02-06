import { Suspense } from 'react';
import { LoginPageClient } from '@/components/auth/login-page-client';

export const metadata = {
  title: 'Login | PLOT',
  description: 'Sign in to your PLOT account',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <LoginPageClient />
    </Suspense>
  );
}
