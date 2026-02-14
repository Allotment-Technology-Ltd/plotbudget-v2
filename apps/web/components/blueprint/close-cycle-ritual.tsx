'use client';

import { useCallback } from 'react';
import { Lock } from 'lucide-react';

interface CloseCycleRitualProps {
  onComplete: () => void;
  isCompleting?: boolean;
  isPreviousCycle?: boolean;
}

/**
 * Simple confirmation: "Close this cycle?" with Close button.
 * On Close, calls onComplete(); celebration overlay is shown by the parent on success.
 */
export function CloseCycleRitual({
  onComplete,
  isCompleting = false,
  isPreviousCycle = false,
}: CloseCycleRitualProps) {
  const handleClose = useCallback(() => {
    if (isCompleting) return;
    onComplete();
  }, [isCompleting, onComplete]);

  const heading = isPreviousCycle
    ? 'Your previous cycle is complete'
    : 'All bills paid for this cycle';
  const confirmPrompt = isPreviousCycle
    ? 'Close it to start your new cycle properly.'
    : 'Close your cycle and lock your budget?';

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 p-6 space-y-5 shadow-lg shadow-primary/5">
      <div className="text-center">
        <h3 className="font-heading text-lg uppercase tracking-wider text-foreground">
          {heading}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{confirmPrompt}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isCompleting}
          className="font-heading uppercase tracking-wider text-sm px-5 py-2.5 rounded-full bg-primary text-primary-foreground shadow border-2 border-primary-foreground/20 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none inline-flex items-center gap-2"
          aria-label="Close cycle"
        >
          <Lock className="w-4 h-4" aria-hidden />
          {isCompleting ? 'Closing…' : 'Close cycle'}
        </button>
      </div>

      {isCompleting && (
        <p className="text-center text-sm text-muted-foreground">
          Closing your cycle…
        </p>
      )}
    </div>
  );
}
