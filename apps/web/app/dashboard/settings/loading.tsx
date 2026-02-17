import { DashboardLoadingSkeleton } from '@/components/loading/dashboard-loading-skeleton';

/**
 * Shown while the settings page is loading.
 */
export default function SettingsLoading() {
  return <DashboardLoadingSkeleton message="Loading settings…" />;
}
