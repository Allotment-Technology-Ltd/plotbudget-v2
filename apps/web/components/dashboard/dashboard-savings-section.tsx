'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-6"
    >
      {pots.length > 0 ? (
        <div className="bg-card rounded-lg p-6 border border-border">
          <SavingsProgressCards pots={pots} currency={currency} />
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
