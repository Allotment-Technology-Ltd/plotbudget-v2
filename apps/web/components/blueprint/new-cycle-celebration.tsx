'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles } from 'lucide-react';

interface NewCycleCelebrationProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dopamine hit when the user starts a new pay cycle — reinforces the ritual
 * of opening budgeting for the month.
 */
export function NewCycleCelebration({ open, onClose }: NewCycleCelebrationProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-cycle-heading"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="bg-card rounded-lg p-8 max-w-md w-full border border-primary/30 shadow-lg"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
                aria-hidden
              >
                <Calendar className="w-10 h-10 text-primary" />
              </motion.div>

              <div>
                <h2
                  id="new-cycle-heading"
                  className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-primary mb-2"
                >
                  New cycle started!
                </h2>
                <p className="text-muted-foreground">
                  Plan your month. You’ve got this.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden />
                <span>15–20 minutes to set up and you’re done.</span>
              </div>

              <Button
                onClick={onClose}
                className="w-full"
                data-testid="new-cycle-celebration-close"
              >
                Plan my month
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
