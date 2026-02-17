import { DashboardLoadingSkeleton } from '@/components/loading/dashboard-loading-skeleton';

/**
 * Shown while the dashboard index is loading.
 */
export default function DashboardLoading() {
  return <DashboardLoadingSkeleton message="Loading dashboard…" />;
}
