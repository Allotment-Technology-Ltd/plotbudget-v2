import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { hapticSuccess } from '@/lib/haptics';
import { markPotComplete } from '@/lib/mark-pot-complete';
import type { Pot } from '@repo/supabase';

export function usePotDetailToggle(
  pot: Pot | null,
  setPot: React.Dispatch<React.SetStateAction<Pot | null>>,
  reload: () => Promise<void>
) {
  const [toggling, setToggling] = useState(false);

  const handleToggleComplete = useCallback(async () => {
    if (!pot || toggling) return;
    const nextStatus = pot.status === 'complete' ? 'active' : 'complete';
    setToggling(true);
    const result = await markPotComplete(pot.id, nextStatus);
    setToggling(false);
    if ('success' in result) {
      hapticSuccess();
      setPot((p) => (p ? { ...p, status: nextStatus } : null));
      void reload();
    } else {
      Alert.alert("Couldn't update pot", result.error ?? "Try again.");
    }
  }, [pot, toggling, setPot, reload]);

  return { toggling, handleToggleComplete };
}
