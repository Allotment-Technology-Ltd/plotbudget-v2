import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { cookies } from 'next/headers';
import { getServerModuleFlags } from '@/lib/posthog-server-flags';
import { redirect } from 'next/navigation';
import { ProjectDetailClient } from '@/components/tasks/project-detail-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Project ${id.slice(0, 8)}…`, description: 'Project detail' };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  return <ProjectDetailClient projectId={id} />;
}
