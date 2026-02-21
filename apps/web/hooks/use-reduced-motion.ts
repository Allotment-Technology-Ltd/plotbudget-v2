'use client';

import { useEffect, useState } from 'react';
import { useCalm } from '@/components/providers/calm-provider';

/**
 * Respect prefers-reduced-motion (accessibility) and user's Calm setting (Rule 9).
 * When either system or Settings → Calm "Reduce motion" is on, animations are reduced.
 */
export function useReducedMotion(): boolean {
  const calm = useCalm();
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemPrefersReduced(mq.matches);
    const handler = () => setSystemPrefersReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return systemPrefersReduced || calm.reduceMotion;
}
