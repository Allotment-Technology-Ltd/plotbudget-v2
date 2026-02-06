import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { DeletedAccountToast } from '@/components/auth/deleted-account-toast';

export const metadata = {
  title: 'Sign up | PLOT',
  description: 'Create your PLOT account',
};

export default function SignupPage() {
  return (
    <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
      <Suspense fallback={null}>
        <DeletedAccountToast />
      </Suspense>
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Create Account
        </h1>
        <p className="text-muted-foreground font-body">
          Sign up to start plotting your budget together
        </p>
      </div>

      <AuthForm mode="signup" />
    </div>
  );
}
