'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    queueMicrotask(() => setPrefersReducedMotion(mq.matches));
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return prefersReducedMotion;
}

interface StartCycleTransitionProps {
  /** After animation, navigate to this path (e.g. /dashboard/money/blueprint?cycle=id&newCycle=1) */
  redirectTo: string;
}

/**
 * Payday-complete ritual: terminal-style transition when user clicks "Start cycle".
 * Builds on the same feel as the onboarding → blueprint transition.
 */
export function StartCycleTransition({ redirectTo }: StartCycleTransitionProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [showScanLine, setShowScanLine] = useState(false);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const lines = [
    '>_ STARTING NEW CYCLE...',
    '>_ SYNCING BLUEPRINT...',
    '>_ BLUEPRINT READY ✓',
  ];

  useEffect(() => {
    if (prefersReducedMotion) {
      router.replace(redirectTo);
      return;
    }
    const t1 = setTimeout(() => setCurrentLine(1), 300);
    const t2 = setTimeout(() => setCurrentLine(2), 900);
    const t3 = setTimeout(() => setCurrentLine(3), 1500);
    const t4 = setTimeout(() => setShowScanLine(true), 2000);
    const t5 = setTimeout(() => router.replace(redirectTo), 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [prefersReducedMotion, redirectTo, router]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.replace(redirectTo);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefersReducedMotion, redirectTo, router]);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Starting new pay cycle"
    >
      <div className="font-display text-lg md:text-xl space-y-3 relative z-10">
        {lines.slice(0, currentLine).map((line, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-primary overflow-hidden whitespace-nowrap"
          >
            {line}
            {index === currentLine - 1 && index === 2 && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="ml-1"
              >
                ▌
              </motion.span>
            )}
          </motion.p>
        ))}
      </div>
      <AnimatePresence>
        {showScanLine && (
          <motion.div
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-0 right-0 h-[2px] z-20"
            style={{
              background: 'rgb(var(--accent-primary))',
              boxShadow: '0 0 20px rgb(var(--accent-glow) / 0.8)',
            }}
          />
        )}
      </AnimatePresence>
      <p className="absolute bottom-8 text-sm text-muted-foreground">
        Press Escape to skip
      </p>
    </motion.div>
  );
}
