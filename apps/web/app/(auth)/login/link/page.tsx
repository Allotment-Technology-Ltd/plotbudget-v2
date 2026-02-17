import { Suspense } from 'react';
import { LoginLinkClient } from '@/components/auth/login-link-client';

export const metadata = {
  title: 'Email sign-in link | PLOT',
  description: 'Get a sign-in link sent to your email',
};

export default function LoginLinkPage() {
  return (
    <Suspense fallback={<div className="bg-card rounded-lg p-8 min-h-[320px]" />}>
      <LoginLinkClient />
    </Suspense>
  );
}
