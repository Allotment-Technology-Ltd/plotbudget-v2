'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {repayments.length > 0 ? (
        <div className="bg-card rounded-lg p-6 border border-border">
          <RepaymentProgressCards repayments={repayments} currency={currency} />
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
