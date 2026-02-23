import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { NewTripWizard } from '@/components/holidays/new-trip-wizard';

export const metadata: Metadata = {
  title: 'Add trip | Holidays',
  description: 'Plan a new trip',
};

export default async function NewTripPage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  return (
    <div className="content-wrapper py-8" data-testid="new-trip-page">
      <NewTripWizard />
    </div>
  );
}
