import type { Metadata } from 'next';
import { getRoadmapFeaturesAdmin } from '@/lib/actions/admin-roadmap-actions';
import { AdminRoadmapPanel } from '@/components/admin/admin-roadmap-panel';

export const metadata: Metadata = {
  title: 'Admin — Roadmap',
  description: 'Edit roadmap features for the PLOT app.',
};

export default async function AdminRoadmapPage() {
  const { data, error } = await getRoadmapFeaturesAdmin();
  return <AdminRoadmapPanel initialData={data} initialError={error} />;
}
