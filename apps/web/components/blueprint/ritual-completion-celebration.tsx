'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, PieChart, AlertCircle, Sparkles } from 'lucide-react';

interface RitualCompletionCelebrationProps {
  open: boolean;
  onClose: () => void;
  /** Total allocated this cycle (sum of seeds) */
  totalAllocated: number;
  /** Total income for this cycle */
  totalIncome: number;
}

type BudgetState = 'within' | 'over' | 'under';

/**
 * Full-screen celebration overlay when all seeds are marked paid.
 * Message reflects whether allocations are within, over, or under income—factual and non-judgmental.
 */
export function RitualCompletionCelebration({
  open,
  onClose,
  totalAllocated,
  totalIncome,
}: RitualCompletionCelebrationProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
          icon: PieChart,
          heading: 'Your allocations are within your income this cycle.',
          body: 'Everything you planned to spend fits your budget.',
        };
      case 'over':
        return {
          icon: AlertCircle,
          heading: 'Your allocations are above your income this cycle.',
          body: 'You can review your blueprint anytime if you’d like to adjust.',
        };
      case 'under':
        return {
          icon: Sparkles,
          heading: 'You have headroom in your budget this cycle.',
          body: 'Your planned spending is below your income.',
        };
    }
  }, [budgetState]);

  const StateIcon = stateMessage.icon;

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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ritual-complete-heading"
          aria-describedby="ritual-complete-description"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="bg-card rounded-lg p-8 max-w-md w-full border border-primary/30 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
                aria-hidden
              >
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </motion.div>

              <div>
                <h2
                  id="ritual-complete-heading"
                  className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-primary mb-2"
                >
                  Ritual Complete!
                </h2>
                <p
                  id="ritual-complete-description"
                  className="text-muted-foreground"
                >
                  All bills marked as paid for this cycle.
                </p>
              </div>

              <div
                className={`p-4 rounded-md border ${
                  budgetState === 'over'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-primary/10 border-primary/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <StateIcon
                    className={`w-5 h-5 ${
                      budgetState === 'over' ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                    }`}
                    aria-hidden
                  />
                  <p className="font-medium">{stateMessage.heading}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stateMessage.body}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className="w-full"
                  data-testid="ritual-celebration-close"
                >
                  Back to Blueprint
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/dashboard')}
                  className="w-full"
                  data-testid="ritual-celebration-dashboard"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
