'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createNextPaycycle } from '@/lib/actions/seed-actions';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/loading/inline-loading';
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
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);

  const handleCreateNext = async () => {
    setIsCreatingCycle(true);
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
    } finally {
      setIsCreatingCycle(false);
    }
  };

  const actions = [
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

  if (actions.length === 0) return null;

  return (
    <section
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      aria-label="Quick actions"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        const isNextCycle = action.label === 'Next Cycle';
        const isLoading = isNextCycle && isCreatingCycle;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label={`${action.label}: ${action.description}`}
            className={`${action.color} rounded-lg p-6 transition-all cursor-pointer border border-transparent hover:border-current text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-wait`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-md bg-background/50" aria-hidden>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-heading text-lg uppercase tracking-wider mb-1">
                  {action.label}
                </p>
                <p className="text-sm opacity-80">
                  {isLoading ? (
                    <InlineLoading message="Creating cycle…" />
                  ) : (
                    action.description
                  )}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </section>
  );
}
