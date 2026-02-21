import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { CalendarPageClient } from '@/components/calendar/calendar-page-client';

export const metadata = {
  title: 'Calendar',
  description: 'Household calendar',
};

export default async function CalendarPage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const hasHousehold = !!(profile?.household_id ?? partnerOf?.id);
  if (!hasHousehold) redirect('/onboarding');

  return <CalendarPageClient />;
}
