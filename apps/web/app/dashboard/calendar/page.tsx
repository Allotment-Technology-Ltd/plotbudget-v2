import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { cookies } from 'next/headers';
import { getServerModuleFlags } from '@/lib/posthog-server-flags';
import { redirect } from 'next/navigation';
import { CalendarPageClient } from '@/components/calendar/calendar-page-client';

export const metadata = {
  title: 'Calendar',
  description: 'Household calendar',
};

export default async function CalendarPage() {
  const { user, profile, partnerOf, isAdmin } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const hasHousehold = !!(profile?.household_id ?? partnerOf?.id);
  if (!hasHousehold) redirect('/onboarding');
  const cookieStore = await cookies();
  const moduleFlags = await getServerModuleFlags(user.id, {
    cookies: cookieStore,
    isAdmin,
  });
  if (!moduleFlags.calendar) redirect('/dashboard/money');

  return <CalendarPageClient />;
}
