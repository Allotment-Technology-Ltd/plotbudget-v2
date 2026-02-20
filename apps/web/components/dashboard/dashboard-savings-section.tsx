'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SavingsProgressCards } from './savings-progress-cards';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';
import type { Pot } from '@repo/supabase';

type Currency = 'GBP' | 'USD' | 'EUR';

interface DashboardSavingsSectionProps {
  pots: Pot[];
  currency?: Currency;
  /** Animation delay in seconds */
  delay?: number;
}

const EMPTY_TITLE = 'Savings goals';
const EMPTY_MESSAGE = 'No savings goals yet. Add them in Blueprint.';

export function DashboardSavingsSection({
  pots,
  currency,
  delay = 0,
}: DashboardSavingsSectionProps) {
  const { setNavigating } = useNavigationProgress();
  const [expanded, setExpanded] = useState(true);
  const hasItems = pots.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-6"
    >
      {hasItems ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div
            className="flex items-center justify-between gap-2 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpanded((e) => !e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded((prev) => !prev);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            aria-controls="dashboard-savings-content"
          >
            <h2
              id="dashboard-savings-heading"
              className="font-heading text-xl uppercase tracking-wider"
            >
              Savings goals
              <span className="font-normal normal-case text-muted-foreground ml-1">
                ({pots.length} {pots.length === 1 ? 'goal' : 'goals'})
              </span>
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/blueprint"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Manage
              </Link>
              <span className="text-muted-foreground" aria-hidden>
                {expanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </span>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                id="dashboard-savings-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-0">
                  <SavingsProgressCards pots={pots} currency={currency} hideTitle />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="font-heading text-xl uppercase tracking-wider mb-4">
            {EMPTY_TITLE}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">{EMPTY_MESSAGE}</p>
          <Link
            href="/dashboard/blueprint"
            onClick={() => setNavigating(true)}
            className="text-primary font-heading text-sm uppercase tracking-wider hover:underline"
          >
            Manage Blueprint
          </Link>
        </div>
      )}
    </motion.div>
  );
}
