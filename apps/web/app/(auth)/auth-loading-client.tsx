'use client';

import { usePathname } from 'next/navigation';

const AUTH_LOADING_MESSAGES: Record<string, string> = {
  '/login': 'Loading sign in…',
  '/signup': 'Loading sign up…',
  '/reset-password': 'Loading reset password…',
};

function getAuthLoadingMessage(pathname: string): string {
  return AUTH_LOADING_MESSAGES[pathname] ?? 'Loading…';
}

/**
 * Auth loading UI: message reflects the auth page being loaded; uses pulsing indicator.
 */
export function AuthLoadingClient() {
  const pathname = usePathname();
  const message = getAuthLoadingMessage(pathname);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-background"
      role="status"
      aria-label={message}
      aria-live="polite"
    >
      <span
        className="loading-pulse h-3 w-3 shrink-0 rounded-full bg-primary"
        aria-hidden
      />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
