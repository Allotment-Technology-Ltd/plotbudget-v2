import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isPreProdContext } from '@/lib/feature-flags';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';
import { isAdminUser } from '@/lib/auth/admin-gate';
import { FlagOverridesForm } from '@/components/admin/flag-overrides-form';

export default async function AdminFlagsPage() {
  const allowed = await isAdminUser();
  if (!allowed) redirect('/dashboard');

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const flags = await getServerFeatureFlags(user.id, {
    cookies: cookieStore,
    isAdmin: true,
  });
  const preProd = isPreProdContext();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
          Feature flag overrides
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Override module flags for testing in pre-production. Changes apply only to your session and do not affect PostHog or production.
        </p>
      </div>
      <section aria-labelledby="flags-overrides-heading">
        <h2 id="flags-overrides-heading" className="font-heading text-lg uppercase tracking-wider text-foreground">
          Module flags
        </h2>
        <div className="mt-4">
          <FlagOverridesForm initialFlags={flags.moduleFlags} preProd={preProd} />
        </div>
      </section>
    </div>
  );
}
