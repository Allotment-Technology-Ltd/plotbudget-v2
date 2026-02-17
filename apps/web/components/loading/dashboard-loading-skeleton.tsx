/**
 * Shared dashboard-area loading UI: context-specific message + pulsing indicator
 * (no spinner; matches onboarding→blueprint transition aesthetic).
 * Used by dashboard, blueprint, and settings loading routes.
 */
export function DashboardLoadingSkeleton({ message }: { message: string }) {
  return (
    <div
      className="content-wrapper py-8"
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span
            className="loading-pulse h-2 w-2 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <span className="text-sm font-medium">{message}</span>
        </div>

        <div className="space-y-6">
          <div className="h-8 w-48 rounded-md skeleton-shimmer" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-lg border border-border bg-card overflow-hidden"
              >
                <div className="h-full w-full skeleton-shimmer" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-lg border border-border bg-card overflow-hidden">
            <div className="h-full w-full skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
