/**
 * Shown while dashboard route segments (dashboard, blueprint, settings) are loading.
 * Reduces perceived sluggishness by giving immediate visual feedback during navigation.
 */
function DashboardLoadingSkeleton() {
  return (
    <div
      className="content-wrapper py-8"
      role="status"
      aria-label="Loading"
    >
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg border border-border bg-card"
            />
          ))}
        </div>
        <div className="h-64 rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return <DashboardLoadingSkeleton />;
}
