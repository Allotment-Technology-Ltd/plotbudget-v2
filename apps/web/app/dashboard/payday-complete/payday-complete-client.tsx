'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { startNextCycle } from '@/lib/actions/ritual-actions';
import { resyncDraftFromActive } from '@/lib/actions/seed-actions';
import { StartCycleTransition } from '@/components/ritual/start-cycle-transition';
import { RefreshCw, Sparkles } from 'lucide-react';

interface PaydayCompleteClientProps {
  activeCycleId: string;
  draftCycleId: string | null;
}

/**
 * Payday-complete ritual: confirm blueprint, optional resync, then Start cycle.
 * No draft: single CTA "Create & start cycle". Has draft: resync (optional) + "Start cycle".
 */
export function PaydayCompleteClient({
  activeCycleId,
  draftCycleId,
}: PaydayCompleteClientProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [newCycleId, setNewCycleId] = useState<string | null>(null);

  const hasDraft = !!draftCycleId;

  const handleStartCycle = async () => {
    setIsStarting(true);
    try {
      const result = await startNextCycle();
      if ('success' in result && result.newCycleId) {
        setNewCycleId(result.newCycleId);
        setShowTransition(true);
      } else {
        toast.error('success' in result ? undefined : result.error);
        setIsStarting(false);
      }
    } catch {
      toast.error('Failed to start cycle');
      setIsStarting(false);
    }
  };

  const handleResync = async () => {
    if (!draftCycleId) return;
    setIsResyncing(true);
    try {
      const result = await resyncDraftFromActive(draftCycleId, activeCycleId);
      if (result.error) toast.error(result.error);
      else {
        toast.success('Blueprint synced from last cycle');
        router.refresh();
      }
    } catch {
      toast.error('Failed to resync');
    } finally {
      setIsResyncing(false);
    }
  };

  if (showTransition && newCycleId) {
    return (
      <StartCycleTransition
        redirectTo={`/dashboard/money/blueprint?cycle=${newCycleId}&newCycle=1`}
      />
    );
  }

  return (
    <div className="content-wrapper section-padding max-w-2xl mx-auto">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 p-6 md:p-8 space-y-6 shadow-lg shadow-primary/5">
        <div className="text-center">
          <h1 className="font-heading text-xl md:text-2xl uppercase tracking-wider text-foreground">
            Start your next cycle
          </h1>
        </div>

        {hasDraft ? (
          <>
            <p className="text-sm text-muted-foreground">
              Confirm your blueprint has pulled across from your previous cycle.
              If you made changes to your last cycle after creating this draft,
              resync to copy those into this blueprint — then start when you’re
              ready.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResync}
                disabled={isResyncing || isStarting}
                className="w-full"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isResyncing ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                {isResyncing ? 'Syncing…' : 'Resync from last cycle'}
              </Button>
              <Button
                type="button"
                onClick={handleStartCycle}
                disabled={isStarting}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" aria-hidden />
                {isStarting ? 'Starting…' : 'Start cycle'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You don’t have a draft yet. We’ll create your next cycle from the
              last one and start it now.
            </p>
            <Button
              type="button"
              onClick={handleStartCycle}
              disabled={isStarting}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden />
              {isStarting ? 'Creating & starting…' : 'Create & start cycle'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
