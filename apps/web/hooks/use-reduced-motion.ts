'use client';

import { useSyncExternalStore } from 'react';
import { useCalm } from '@/components/providers/calm-provider';

/**
 * Respect prefers-reduced-motion (accessibility) and user's Calm setting (Rule 9).
 * When either system or Settings → Calm "Reduce motion" is on, animations are reduced.
 */
export function useReducedMotion(): boolean {
  const calm = useCalm();
  const systemPrefersReduced = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = () => onStoreChange();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    },
    () => (typeof window === 'undefined' ? false : window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    () => false
  );

  return systemPrefersReduced || calm.reduceMotion;
}
