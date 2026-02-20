'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RepaymentProgressCards } from './repayment-progress-cards';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';
import type { Repayment } from '@repo/supabase';

type Currency = 'GBP' | 'USD' | 'EUR';

interface DashboardRepaymentSectionProps {
  repayments: Repayment[];
  currency?: Currency;
  /** Animation delay in seconds */
  delay?: number;
}

const EMPTY_TITLE = 'Debt progress';
const EMPTY_MESSAGE = 'No debts yet. Add them in Blueprint.';

export function DashboardRepaymentSection({
  repayments,
  currency,
  delay = 0.05,
}: DashboardRepaymentSectionProps) {
  const { setNavigating } = useNavigationProgress();
  const [expanded, setExpanded] = useState(true);
  const hasItems = repayments.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
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
            aria-controls="dashboard-debt-content"
          >
            <h2
              id="dashboard-debt-heading"
              className="font-heading text-xl uppercase tracking-wider"
            >
              Debt progress
              <span className="font-normal normal-case text-muted-foreground ml-1">
                ({repayments.length} {repayments.length === 1 ? 'debt' : 'debts'})
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
                id="dashboard-debt-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-0">
                  <RepaymentProgressCards repayments={repayments} currency={currency} hideTitle />
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
