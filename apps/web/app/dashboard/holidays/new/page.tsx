import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { getModule } from '@repo/logic';
import { NewTripForm } from '@/components/holidays/new-trip-form';

export const metadata: Metadata = {
  title: 'Add trip | Holidays',
  description: 'Plan a new trip',
};

export default async function NewTripPage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const module = getModule('holidays');
  const moduleColor = module.colorLight;

  return (
    <div className="content-wrapper section-padding" data-testid="new-trip-page">
      <Link
        href="/dashboard/holidays"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        data-testid="back-to-holidays"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All trips
      </Link>

      <div className="mb-6">
        <h1
          className="font-heading text-2xl uppercase tracking-widest text-foreground mb-1"
          style={{ color: moduleColor }}
        >
          Add trip
        </h1>
        <p className="text-muted-foreground text-sm">
          Plan a new trip for your household.
        </p>
      </div>

      <NewTripForm />
    </div>
  );
}
