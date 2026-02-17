'use client';

import { useNavigationProgress } from './navigation-progress-context';

/**
 * Thin progress bar at the top of the viewport. Shown during route transitions
 * to give immediate feedback that navigation is in progress.
 */
export function NavigationProgressBar() {
  const { isNavigating } = useNavigationProgress();

  if (!isNavigating) return null;

  return (
    <div
      className="fixed left-0 top-0 z-[100] h-0.5 w-full overflow-hidden bg-primary/20"
      role="progressbar"
      aria-label="Loading"
    >
      <div className="navigation-progress-stripe h-full w-1/3 bg-primary" />
    </div>
  );
}
