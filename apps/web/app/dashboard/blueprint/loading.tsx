import { DashboardLoadingSkeleton } from '@/components/loading/dashboard-loading-skeleton';

/**
 * Shown while the blueprint page is loading.
 */
export default function BlueprintLoading() {
  return <DashboardLoadingSkeleton message="Loading blueprint…" />;
}
