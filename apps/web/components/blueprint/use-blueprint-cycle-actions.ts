'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  createNextPaycycle,
  resyncDraftFromActive,
} from '@/lib/actions/seed-actions';
import { closeRitual, unlockRitual } from '@/lib/actions/ritual-actions';

export interface UseBlueprintCycleActionsParams {
  paycycleId: string;
  activePaycycleId: string | null;
  onRefresh: () => void;
  onShowCelebration: () => void;
}

export function useBlueprintCycleActions({
  paycycleId,
  activePaycycleId,
  onRefresh,
  onShowCelebration,
}: UseBlueprintCycleActionsParams) {
  const router = useRouter();
  const [isClosingRitual, setIsClosingRitual] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [isResyncingDraft, setIsResyncingDraft] = useState(false);
  const [isSwitchingCycle, setIsSwitchingCycle] = useState(false);

  useEffect(() => {
    setIsSwitchingCycle(false);
  }, [paycycleId]);

  const handleCycleChange = useCallback(
    (cycleId: string) => {
      if (cycleId === paycycleId) return;
      setIsSwitchingCycle(true);
      router.push(`/dashboard/money/blueprint?cycle=${cycleId}`);
    },
    [paycycleId, router]
  );

  const handleCreateNext = useCallback(async () => {
    setIsCreatingCycle(true);
    try {
      const result = await createNextPaycycle(paycycleId);
      if (result.cycleId) {
        router.push(`/dashboard/money/blueprint?cycle=${result.cycleId}&newCycle=1`);
        onRefresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to create next cycle');
    } finally {
      setIsCreatingCycle(false);
    }
  }, [paycycleId, router, onRefresh]);

  const handleResyncDraft = useCallback(async () => {
    if (!activePaycycleId) return;
    setIsResyncingDraft(true);
    try {
      const result = await resyncDraftFromActive(paycycleId, activePaycycleId);
      if (!result.error) {
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to resync draft');
    } finally {
      setIsResyncingDraft(false);
    }
  }, [paycycleId, activePaycycleId, onRefresh]);

  const handleCloseRitual = useCallback(async () => {
    setIsClosingRitual(true);
    try {
      const result = await closeRitual(paycycleId);
      if ('success' in result) {
        onShowCelebration();
      } else {
        toast.error(result.error ?? "Couldn't close cycle");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't close cycle");
    } finally {
      setIsClosingRitual(false);
    }
  }, [paycycleId, onShowCelebration]);

  const handleUnlock = useCallback(async () => {
    setIsUnlocking(true);
    const result = await unlockRitual(paycycleId);
    setIsUnlocking(false);
    if ('success' in result) onRefresh();
  }, [paycycleId, onRefresh]);

  return {
    handleCycleChange,
    handleCreateNext,
    handleResyncDraft,
    handleCloseRitual,
    handleUnlock,
    isClosingRitual,
    isUnlocking,
    isCreatingCycle,
    isResyncingDraft,
    isSwitchingCycle,
  };
}
