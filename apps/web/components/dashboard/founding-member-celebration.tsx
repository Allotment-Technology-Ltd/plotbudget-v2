'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FOUNDING_MEMBER_PREMIUM_BENEFITS = [
  'Unlimited Needs',
  'Unlimited Wants',
  'Unlimited savings pots',
  'Unlimited repayments',
] as const;

const STORAGE_KEY_PREFIX = 'founding-member-celebration-seen-';

interface FoundingMemberCelebrationProps {
  userId: string;
  foundingMemberUntil: string;
}

function formatEndDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function FoundingMemberCelebration({
  userId,
  foundingMemberUntil,
}: FoundingMemberCelebrationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `${STORAGE_KEY_PREFIX}${userId}`;
    try {
      const seen = localStorage.getItem(key);
      if (!seen) {
        setOpen(true);
      }
    } catch {
      setOpen(false);
    }
  }, [userId]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, 'true');
      } catch {
        // Ignore
      }
    }
    setOpen(isOpen);
  };

  const endDate = formatEndDate(foundingMemberUntil);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm"
        showClose
        aria-describedby="founding-member-benefits"
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <DialogTitle className="text-center">
            You&apos;re a Founding Member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
            You have 6 months of Premium access free until {endDate}. Thanks for
            being here from the start.
          </p>
          <div
            id="founding-member-benefits"
            className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-left"
          >
            <p className="mb-2 text-xs font-heading uppercase tracking-wider text-muted-foreground">
              Your benefits
            </p>
            <ul className="space-y-1.5">
              {FOUNDING_MEMBER_PREMIUM_BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Button
          onClick={() => handleClose(false)}
          className="w-full"
          aria-label="Got it"
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
