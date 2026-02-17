import { AuthBrandHeader } from '@/components/auth/auth-brand-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--primary)), transparent)',
        }}
      />
      <div className="relative z-10">
        <AuthBrandHeader
          tagline="The 20-minute payday ritual for UK households"
          linkToHome
        />
      </div>
      <div className="w-full max-w-md mt-10 relative z-10">
        {children}
      </div>
    </div>
  );
}
