'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Plus, Edit3, PiggyBank, CreditCard } from 'lucide-react';
import { currencySymbol } from '@/lib/utils/currency';
import type { Seed, Pot, Repayment } from '@repo/supabase';

interface RecentActivityProps {
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  currency?: 'GBP' | 'USD' | 'EUR';
}

const TYPE_LABELS: Record<Seed['type'], string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repay',
};

type ActivityItem =
  | {
      type: 'seed';
      id: string;
      label: string;
      sublabel: string;
      at: string;
      icon: 'add' | 'edit';
    }
  | {
      type: 'pot';
      id: string;
      label: string;
      sublabel: string;
      at: string;
    }
  | {
      type: 'repayment';
      id: string;
      label: string;
      sublabel: string;
      at: string;
    };

function buildActivity(
  seeds: Seed[],
  pots: Pot[],
  repayments: Repayment[],
  currency: string = 'GBP'
): ActivityItem[] {
  const items: ActivityItem[] = [];

  seeds.forEach((s) => {
    items.push({
      type: 'seed',
      id: s.id,
      label: s.name,
      sublabel: `${currencySymbol(currency as 'GBP' | 'USD' | 'EUR')}${s.amount.toFixed(2)} (${TYPE_LABELS[s.type]})`,
      at: s.created_at,
      icon: 'add',
    });
    if (s.updated_at && s.updated_at !== s.created_at) {
      items.push({
        type: 'seed',
        id: s.id,
        label: `Edited ${s.name}`,
        sublabel: TYPE_LABELS[s.type],
        at: s.updated_at,
        icon: 'edit',
      });
    }
  });

  pots.forEach((p) => {
    items.push({
      type: 'pot',
      id: p.id,
      label: `Created ${p.name}`,
      sublabel: 'Savings',
      at: p.created_at,
    });
  });

  repayments.forEach((r) => {
    items.push({
      type: 'repayment',
      id: r.id,
      label: `Added ${r.name}`,
      sublabel: 'Debt',
      at: r.created_at,
    });
  });

  items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );
  return items.slice(0, 10);
}

export function RecentActivity({
  seeds,
  pots,
  repayments,
  currency = 'GBP',
}: RecentActivityProps) {
  const activity = buildActivity(seeds, pots, repayments, currency);

  if (activity.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-6 border border-border"
        aria-label="Recent activity"
      >
        <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
          Recent Activity
        </h2>
        <p className="text-muted-foreground text-sm py-6">
          No recent activity. Add your first expense in Blueprint.
        </p>
        <Link
          href="/dashboard/blueprint"
          className="text-primary font-heading text-sm uppercase tracking-wider hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Add expense
        </Link>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Recent activity"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl uppercase tracking-wider">
          Recent Activity
        </h2>
        <Link
          href="/dashboard/blueprint"
          className="text-xs font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          View All
        </Link>
      </div>

      <ul className="space-y-3" aria-label="Activity timeline">
        {activity.map((item, index) => {
          const Icon =
            item.type === 'seed'
              ? item.icon === 'add'
                ? Plus
                : Edit3
              : item.type === 'pot'
                ? PiggyBank
                : CreditCard;
          const isSeed = item.type === 'seed';
          const isPot = item.type === 'pot';
          const isRepayment = item.type === 'repayment';
          const editHref = isSeed
            ? `/dashboard/blueprint?edit=${item.id}`
            : isPot || isRepayment
              ? '/dashboard/blueprint'
              : null;
          const rowContent = (
            <>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted"
                aria-hidden
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-foreground truncate uppercase">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.sublabel} ·{' '}
                  {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                </p>
              </div>
            </>
          );
          return (
            <li
              key={`${item.type}-${item.id}-${item.at}-${index}`}
              className="flex gap-3 text-sm"
            >
              {editHref ? (
                <Link
                  href={editHref}
                  className="flex gap-3 min-w-0 flex-1 rounded-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 -m-1 p-1"
                  aria-label={isSeed ? `Edit ${item.label}` : `View ${item.label} in Blueprint`}
                >
                  {rowContent}
                </Link>
              ) : (
                rowContent
              )}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
