import Link from 'next/link';

export const metadata = {
  title: 'Sign up | PLOT',
  description: 'Create your PLOT account',
};

export default function SignupPage() {
  return (
    <div className="bg-card rounded-lg p-8 space-y-6" data-testid="signup-page">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Private Beta
        </h1>
        <p className="text-muted-foreground font-body">
          PlotBudget is currently in private testing. If you have an account,
          please sign in.
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Link
          href="/login"
          className="btn-primary inline-flex items-center justify-center rounded-md px-6 py-3"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
