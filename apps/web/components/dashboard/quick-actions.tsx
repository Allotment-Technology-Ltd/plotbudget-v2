'use client';

import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createNextPaycycle } from '@/lib/actions/seed-actions';
import { toast } from 'sonner';
import type { Household, PayCycle } from '@repo/supabase';

interface QuickActionsProps {
  household: Household;
  paycycle: PayCycle;
  hasDraftCycle: boolean;
}

export function QuickActions({
  paycycle,
  hasDraftCycle,
}: QuickActionsProps) {
  const router = useRouter();

  const handleCreateNext = async () => {
    try {
      const result = await createNextPaycycle(paycycle.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Next paycycle created!');
      router.refresh();
    } catch {
      toast.error('Failed to create next cycle');
    }
  };

  const actions = [
    {
      label: 'Add Expense',
      description: 'Quick add a bill or purchase',
      icon: Plus,
      href: '/dashboard/blueprint?action=add',
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    ...(hasDraftCycle
      ? []
      : [
          {
            label: 'Next Cycle',
            description: 'Create next pay period',
            icon: ArrowRight,
            onClick: handleCreateNext,
            color:
              'bg-secondary/10 text-secondary-foreground hover:bg-secondary/20',
          },
        ]),
  ];

  return (
    <section
      className={`grid grid-cols-1 gap-4 ${actions.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}
      aria-label="Quick actions"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        if (action.href) {
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.color} rounded-lg p-6 transition-all cursor-pointer border border-transparent hover:border-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              aria-label={`${action.label}: ${action.description}`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-md bg-background/50" aria-hidden>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-heading text-lg uppercase tracking-wider mb-1">
                    {action.label}
                  </p>
                  <p className="text-sm opacity-80">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        }
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`${action.color} rounded-lg p-6 transition-all cursor-pointer border border-transparent hover:border-current text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
            aria-label={`${action.label}: ${action.description}`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-background/50" aria-hidden>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading text-lg uppercase tracking-wider mb-1">
                  {action.label}
                </p>
                <p className="text-sm opacity-80">{action.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
