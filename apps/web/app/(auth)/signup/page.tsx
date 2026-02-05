import { AuthForm } from '@/components/auth/auth-form';

export const metadata = {
  title: 'Sign up | PLOT',
  description: 'Create your PLOT account',
};

export default function SignupPage() {
  return (
    <div className="bg-card rounded-lg p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Get Started
        </h1>
        <p className="text-muted-foreground font-body">
          Create your PLOT account
        </p>
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
        <p className="text-sm font-body">
          <strong>Password tip:</strong> Use 3 random words
          <br />
          <span className="text-muted-foreground">
            e.g. coffee-piano-sunset
          </span>
        </p>
      </div>

      <AuthForm mode="signup" />
    </div>
  );
}
