/**
 * Shown while auth route segments (login, signup, reset-password) are loading.
 */
export default function AuthLoading() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center bg-background"
      role="status"
      aria-label="Loading"
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
