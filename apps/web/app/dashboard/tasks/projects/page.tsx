import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { ProjectsListClient } from '@/components/tasks/projects-list-client';

export const metadata = {
  title: 'Projects',
  description: 'Household projects and phases',
};

export default async function ProjectsListPage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const hasHousehold = !!(profile?.household_id ?? partnerOf?.id);
  if (!hasHousehold) redirect('/onboarding');

  return <ProjectsListClient />;
}
