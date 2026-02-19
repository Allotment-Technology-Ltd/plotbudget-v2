'use client';

import { useState, useEffect } from 'react';

/** Breakpoint (px) below which we consider the screen narrow (e.g. for chart tick spacing). Matches Tailwind sm. */
const NARROW_BREAKPOINT = 640;

/**
 * True when viewport width is below the narrow breakpoint (640px).
 * Use in charts to show fewer axis ticks on phone and avoid overlapping labels.
 */
export function useIsNarrowScreen(): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const check = () => setIsNarrow(typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isNarrow;
}
