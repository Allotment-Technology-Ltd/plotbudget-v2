'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCalm } from '@/components/providers/calm-provider';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface CelebrationSequenceProps {
  onComplete?: () => void;
  /** When set (couple onboarding), show invite step so user can copy link before going to blueprint */
  partnerInviteUrl?: string | null;
  partnerName?: string | null;
}

export function CelebrationSequence({
  onComplete,
  partnerInviteUrl,
  partnerName,
}: CelebrationSequenceProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [showScanLine, setShowScanLine] = useState(false);
  const [showInviteStep, setShowInviteStep] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { celebrations } = useCalm();
  const hasPartnerInvite = Boolean(partnerInviteUrl);
  const skipAnimation = reducedMotion || !celebrations;

  const lines = [
    '>_ INITIALIZING PAYCYCLE...',
    '>_ CALCULATING ALLOCATIONS...',
    '>_ BLUEPRINT READY ✓',
  ];

  // Skip animation: go to blueprint or show invite step (couple)
  useEffect(() => {
    if (skipAnimation && !hasPartnerInvite) {
      router.push('/dashboard/money/blueprint');
    } else if (skipAnimation && hasPartnerInvite) {
      setShowInviteStep(true);
    }
  }, [skipAnimation, hasPartnerInvite, router]);

  useEffect(() => {
    if (skipAnimation) return;

    const timer1 = setTimeout(() => setCurrentLine(1), 300);
    const timer2 = setTimeout(() => setCurrentLine(2), 900);
    const timer3 = setTimeout(() => setCurrentLine(3), 1500);
    const timer4 = setTimeout(() => setShowScanLine(true), 2000);
    const timer5 = setTimeout(() => {
      if (hasPartnerInvite) {
        setShowInviteStep(true);
      } else {
        router.push('/dashboard/money/blueprint');
      }
    }, 3300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [skipAnimation, hasPartnerInvite, onComplete, router]);

  useEffect(() => {
    if (skipAnimation && !hasPartnerInvite) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/dashboard/money/blueprint');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [skipAnimation, hasPartnerInvite, onComplete, router]);

  if (skipAnimation && !hasPartnerInvite) {
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

      {/* Partner invite step: show after animation when couple onboarding */}
      <AnimatePresence>
        {showInviteStep && partnerInviteUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/90 p-6"
          >
            <div className="rounded-lg border border-border bg-card p-6 shadow-elevated max-w-sm w-full space-y-4 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Invite {partnerName || 'your partner'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Copy the link and share it so they can join your household and budget together.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  disabled={copyLoading}
                  onClick={async () => {
                    setCopyLoading(true);
                    try {
                      await navigator.clipboard.writeText(partnerInviteUrl);
                      toast.success('Invite link copied');
                    } catch {
                      toast.error('Could not copy link');
                    } finally {
                      setCopyLoading(false);
                    }
                  }}
                >
                  {copyLoading ? 'Copied!' : 'Copy invite link'}
                </Button>
                <Button
                  onClick={() => router.push('/dashboard/money/blueprint')}
                >
                  Continue to Blueprint
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text (hidden when invite step is showing) */}
      {!showInviteStep && (
        <p className="absolute bottom-8 text-sm text-muted-foreground">
          Press Escape to skip
        </p>
      )}
    </motion.div>
  );
}
