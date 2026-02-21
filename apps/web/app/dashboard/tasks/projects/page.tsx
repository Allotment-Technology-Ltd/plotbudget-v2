import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { cookies } from 'next/headers';
import { getServerModuleFlags } from '@/lib/posthog-server-flags';
import { redirect } from 'next/navigation';
import { ProjectsListClient } from '@/components/tasks/projects-list-client';

export const metadata = {
  title: 'Projects',
  description: 'Household projects and phases',
};

export default async function ProjectsListPage() {
  const { user, profile, partnerOf, isAdmin } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const hasHousehold = !!(profile?.household_id ?? partnerOf?.id);
  if (!hasHousehold) redirect('/onboarding');
  const cookieStore = await cookies();
  const moduleFlags = await getServerModuleFlags(user.id, {
    cookies: cookieStore,
    isAdmin,
  });
  if (!moduleFlags.tasks) redirect('/dashboard/money');

  return <ProjectsListClient />;
}
