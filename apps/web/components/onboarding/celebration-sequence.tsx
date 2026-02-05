'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Hook: respect prefers-reduced-motion for accessibility */
function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

interface CelebrationSequenceProps {
  onComplete?: () => void;
}

export function CelebrationSequence({ onComplete }: CelebrationSequenceProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [showScanLine, setShowScanLine] = useState(false);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const lines = [
    '>_ INITIALIZING PAYCYCLE...',
    '>_ CALCULATING ALLOCATIONS...',
    '>_ BLUEPRINT READY ✓',
  ];

  // If user prefers reduced motion, skip animation and go straight to Blueprint
  useEffect(() => {
    if (prefersReducedMotion) {
      if (onComplete) onComplete();
      router.push('/dashboard/blueprint');
    }
  }, [prefersReducedMotion, onComplete, router]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer1 = setTimeout(() => setCurrentLine(1), 300);
    const timer2 = setTimeout(() => setCurrentLine(2), 900);
    const timer3 = setTimeout(() => setCurrentLine(3), 1500);
    const timer4 = setTimeout(() => setShowScanLine(true), 2000);
    const timer5 = setTimeout(() => {
      if (onComplete) onComplete();
      router.push('/dashboard/blueprint');
    }, 3300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [prefersReducedMotion, onComplete, router]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onComplete) onComplete();
        router.push('/dashboard/blueprint');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prefersReducedMotion, onComplete, router]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Creating your budget"
    >
      {/* Terminal text */}
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

      {/* Scan line */}
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

      {/* Hint text */}
      <p className="absolute bottom-8 text-sm text-muted-foreground">
        Press Escape to skip
      </p>
    </motion.div>
  );
}
