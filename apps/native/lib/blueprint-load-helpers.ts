/**
 * Blueprint screen load-data helpers: repair stale allocations and overdue refetch.
 * Extracted so the screen file stays focused on UI.
 */

import { fetchBlueprintData, type BlueprintData } from '@/lib/blueprint-data';
import { markOverdueSeedsPaid } from '@/lib/mark-overdue-seeds';
import { recomputePaycycleAllocations } from '@/lib/paycycle-api';

/** Repair stale allocations: recompute when total_allocated is missing/zero or doesn't match sum of seed amounts. Returns refetched result if recomputed, else original. */
export async function repairStaleAllocations(result: BlueprintData): Promise<BlueprintData> {
  const pc = result.paycycle as { total_allocated?: number } | null;
  const storedTotal = pc?.total_allocated != null ? Number(pc.total_allocated) : null;
  const sumFromSeeds = result.seeds.reduce((s, seed) => s + Number(seed.amount), 0);
  const totalMismatch =
    result.paycycle &&
    result.seeds.length > 0 &&
    (storedTotal == null || storedTotal === 0 || Math.abs(storedTotal - sumFromSeeds) > 0.01);
  if (!totalMismatch) return result;
  const recomputed = await recomputePaycycleAllocations(result.paycycle!.id);
  if ('success' in recomputed) {
    return fetchBlueprintData({ selectedCycleId: result.paycycle!.id });
  }
  return result;
}

/** If active paycycle, try mark-overdue then refetch. Returns refetched data or null on skip/failure. */
export async function tryOverdueRefetch(
  paycycleId: string,
  selectedCycleId: string | null | undefined
): Promise<BlueprintData | null> {
  try {
    const overdueResult = await markOverdueSeedsPaid(paycycleId);
    if ('success' in overdueResult) {
      return fetchBlueprintData({ selectedCycleId: selectedCycleId ?? undefined });
    }
  } catch (err) {
    if (__DEV__) console.warn('[Blueprint] markOverdueSeedsPaid failed (showing blueprint anyway):', err);
  }
  return null;
}
