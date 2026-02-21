import { getCachedDashboardAuth } from '@/lib/auth/server-auth-cache';
import { redirect } from 'next/navigation';
import { ProjectDetailClient } from '@/components/tasks/project-detail-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Project ${id.slice(0, 8)}…`, description: 'Project detail' };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const hasHousehold = !!(profile?.household_id ?? partnerOf?.id);
  if (!hasHousehold) redirect('/onboarding');

  const { id } = await params;
  return <ProjectDetailClient projectId={id} />;
}
