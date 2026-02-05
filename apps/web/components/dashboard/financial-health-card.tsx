'use client';

import { CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

interface FinancialHealthCardProps {
  paycycle: PayCycle;
  household: Household;
  seeds: Seed[];
}

/**
 * Financial health score (0–100) based on budget adherence, unpaid bills, and savings.
 */
function calculateHealthScore(
  paycycle: PayCycle,
  household: Household,
  seeds: Seed[]
): { score: number; insights: { text: string; type: 'good' | 'warning' | 'info' }[] } {
  let score = 100;
  const insights: { text: string; type: 'good' | 'warning' | 'info' }[] = [];

  const categories = ['needs', 'wants', 'savings', 'repay'] as const;
  let overAllocatedCount = 0;

  categories.forEach((cat) => {
    const target =
      paycycle.total_income * ((household[`${cat}_percent`] as number) / 100);
    const allocated =
      (paycycle[`alloc_${cat}_me`] as number) +
      (paycycle[`alloc_${cat}_partner`] as number) +
      (paycycle[`alloc_${cat}_joint`] as number);
    if (allocated > target) {
      score -= 15;
      overAllocatedCount++;
    }
  });

  if (overAllocatedCount > 0) {
    insights.push({
      text: `Over budget in ${overAllocatedCount} ${overAllocatedCount === 1 ? 'category' : 'categories'}`,
      type: 'warning',
    });
  } else {
    insights.push({
      text: 'On budget in all categories',
      type: 'good',
    });
  }

  const unpaidSeeds = seeds.filter((s) => !s.is_paid);
  if (unpaidSeeds.length > 0) {
    insights.push({
      text: `${unpaidSeeds.length} ${unpaidSeeds.length === 1 ? 'bill' : 'bills'} unpaid`,
      type: 'info',
    });
  } else {
    score += 10;
    insights.push({
      text: 'All bills paid',
      type: 'good',
    });
  }

  const savingsSeeds = seeds.filter((s) => s.type === 'savings');
  if (savingsSeeds.length > 0) {
    insights.push({
      text: `${savingsSeeds.length} savings ${savingsSeeds.length === 1 ? 'goal' : 'goals'} active`,
      type: 'good',
    });
  }

  score = Math.max(0, Math.min(100, score));
  return { score, insights };
}

function getScoreLabel(s: number): { text: string; color: string } {
  if (s >= 90) return { text: 'Excellent!', color: 'text-primary' };
  if (s >= 75) return { text: 'Good', color: 'text-primary' };
  if (s >= 60) return { text: 'Fair', color: 'text-warning' };
  return { text: 'Needs Attention', color: 'text-destructive' };
}

export function FinancialHealthCard({
  paycycle,
  household,
  seeds,
}: FinancialHealthCardProps) {
  const { score, insights } = calculateHealthScore(paycycle, household, seeds);
  const scoreLabel = getScoreLabel(score);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Financial health score"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
        Financial Health
      </h2>

      <div className="text-center mb-6">
        <p
          className={`text-6xl font-display ${scoreLabel.color}`}
          aria-live="polite"
          aria-label={`Score ${score} out of 100`}
        >
          {score}
        </p>
        <p className="text-lg text-muted-foreground">out of 100</p>
        <p className={`text-sm font-medium mt-2 ${scoreLabel.color}`}>
          {scoreLabel.text}
        </p>
      </div>

      <div
        className="h-3 bg-muted rounded-full overflow-hidden mb-6"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Health score progress"
      >
        <motion.div
          className={`h-full transition-all ${
            score >= 75
              ? 'bg-primary'
              : score >= 60
                ? 'bg-warning'
                : 'bg-destructive'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <ul className="space-y-2" aria-label="Health insights">
        {insights.map((insight, index) => {
          const Icon =
            insight.type === 'good'
              ? CheckCircle2
              : insight.type === 'warning'
                ? AlertCircle
                : TrendingUp;
          const iconColor =
            insight.type === 'good'
              ? 'text-primary'
              : insight.type === 'warning'
                ? 'text-warning'
                : 'text-muted-foreground';
          return (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${iconColor}`}
                aria-hidden
              />
              <span className="text-muted-foreground">{insight.text}</span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
