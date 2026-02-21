'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useCalm } from '@/components/providers/calm-provider';

interface RitualCompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  totalAllocated: number;
  totalIncome: number;
}

type BudgetState = 'within' | 'over' | 'under';

/**
 * Full-screen celebration overlay: terminal/cyberpunk aesthetic.
 * Green-on-black, monospace, scanlines; budget state as terminal output.
 */
export function RitualCompletionCelebration({
  open,
  onClose,
  totalAllocated,
  totalIncome,
}: RitualCompletionCelebrationProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const { celebrations } = useCalm();
  const t = (d: number) => (reducedMotion ? 0 : d);

  useEffect(() => {
    if (open && !celebrations) {
      onClose();
    }
  }, [open, celebrations, onClose]);

  const budgetState: BudgetState = useMemo(() => {
    const allocated = Number(totalAllocated);
    const income = Number(totalIncome);
    if (income <= 0) return 'within';
    if (allocated > income) return 'over';
    if (allocated < income) return 'under';
    return 'within';
  }, [totalAllocated, totalIncome]);

  const stateMessage = useMemo(() => {
    switch (budgetState) {
      case 'within':
        return {
          heading: 'Your allocations are within your income this cycle.',
          body: 'Everything you planned to spend fits your budget.',
        };
      case 'over':
        return {
          heading: 'Your allocations are above your income this cycle.',
          body: "You can review your blueprint anytime if you'd like to adjust.",
        };
      case 'under':
        return {
          heading: 'You have headroom in your budget this cycle.',
          body: 'Your planned spending is below your income.',
        };
    }
  }, [budgetState]);

  const stateBorderColor =
    budgetState === 'over'
      ? 'border-amber-500/40 bg-amber-950/20'
      : 'border-emerald-500/30 bg-emerald-950/20';

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: t(0.15) }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ritual-complete-heading"
          aria-describedby="ritual-complete-description"
        >
          {/* Subtle scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.03]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.03) 2px,
                rgba(255,255,255,0.03) 4px
              )`,
            }}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: t(0.2) }}
            className="relative w-full max-w-md rounded border-2 border-emerald-500/60 bg-black shadow-[0_0_30px_rgba(16,185,129,0.15)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Terminal title bar */}
            <div className="border-b border-emerald-500/40 bg-emerald-950/40 px-4 py-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-amber-500/60" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-emerald-700/60" aria-hidden />
              <span className="font-mono text-xs text-emerald-400/80 ml-2 tracking-widest">
                PLOT — RITUAL
              </span>
            </div>

            <div className="p-6 font-mono text-sm space-y-5">
              <div className="text-center space-y-2">
                <motion.h2
                  id="ritual-complete-heading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: t(0.1) }}
                  className="text-xl font-heading uppercase tracking-wider text-emerald-400"
                >
                  Ritual Complete!
                </motion.h2>
                <motion.p
                  id="ritual-complete-description"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: t(0.2) }}
                  className="text-muted-foreground text-sm"
                >
                  You closed your cycle. Budget locked for the month.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: t(0.35) }}
                className={`rounded border p-4 ${stateBorderColor}`}
              >
                <p
                  className={`font-medium mb-1 ${
                    budgetState === 'over' ? 'text-amber-400' : 'text-emerald-400/95'
                  }`}
                >
                  {stateMessage.heading}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stateMessage.body}
                </p>
                {!reducedMotion && (
                  <motion.span
                    className="inline-block w-2 h-4 ml-0.5 bg-emerald-400/80 align-middle mt-1"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    aria-hidden
                  />
                )}
              </motion.div>

              <div className="pt-1 flex flex-wrap gap-3">
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="font-mono uppercase tracking-wider text-xs px-4 py-2 rounded border border-emerald-500/60 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-500/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400/50 transition-colors"
                  data-testid="ritual-celebration-close"
                >
                  Back to Blueprint
                </button>
                <button
                  type="button"
                  onClick={() => (window.location.href = '/dashboard/money')}
                  className="font-mono uppercase tracking-wider text-xs px-4 py-2 rounded border border-white/20 text-muted-foreground hover:bg-white/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/30 transition-colors"
                  data-testid="ritual-celebration-dashboard"
                >
                  View Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
