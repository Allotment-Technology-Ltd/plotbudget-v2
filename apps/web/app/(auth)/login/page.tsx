import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';

export const metadata = {
  title: 'Login | PLOT',
  description: 'Sign in to your PLOT account',
};

export default function LoginPage() {
  return (
    <div className="bg-card rounded-lg p-8 space-y-6">
      <Suspense fallback={null}>
        <DeletedAccountToast />
      </Suspense>
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Welcome Back
        </h1>
        <p className="text-muted-foreground font-body">
          Sign in to your PLOT account
        </p>
      </div>

      <AuthForm mode="login" />
    </div>
  );
}
