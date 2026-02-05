import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PartnerLoginPage() {
  async function handleSubmit(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    if (!email) return;

    // TODO: Implement in Phase 6.2 (send email with new magic link)
    // await sendPartnerMagicLink(email);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Partner Login</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a login link
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <Input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
          />
          <Button type="submit" className="w-full">
            Send Login Link
          </Button>
        </form>
      </div>
    </div>
  );
}
