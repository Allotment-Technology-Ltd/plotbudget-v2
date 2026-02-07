'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IncomeThisCycle } from '@/components/dashboard/income-this-cycle';
import { BlueprintHeader } from './blueprint-header';
import { CategorySummaryGrid } from './category-summary-grid';
import { TotalAllocatedSummary } from './total-allocated-summary';
import { CategoryRatioDialog } from './category-ratio-dialog';
import { JointAccountSummary } from './joint-account-summary';
import { RitualTransferSummary } from './ritual-transfer-summary';
import { RitualCompletionCelebration } from './ritual-completion-celebration';
import { CloseCycleRitual } from './close-cycle-ritual';
import { NewCycleCelebration } from './new-cycle-celebration';
import { SeedsList } from './seeds-list';
import { SeedDialog } from './seed-dialog';
import { DeleteSeedConfirmDialog } from './delete-seed-confirm-dialog';
import {
  deleteSeed,
  createNextPaycycle,
  resyncDraftFromActive,
} from '@/lib/actions/seed-actions';
import { markSeedPaid, unmarkSeedPaid, closeRitual, unlockRitual } from '@/lib/actions/ritual-actions';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Household = Database['public']['Tables']['households']['Row'];
type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Seed = Database['public']['Tables']['seeds']['Row'];
type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];

interface PaycycleOption {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface BlueprintClientProps {
  household: Household;
  paycycle: Paycycle;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  allPaycycles: PaycycleOption[];
  activePaycycleId: string | null;
  hasDraftCycle: boolean;
  userAvatarUrl?: string | null;
  avatarEnabled?: boolean;
  /** When set, open the edit dialog for this seed (e.g. from dashboard recent activity). */
  initialEditSeedId?: string | null;
  /** When true, show "New cycle started!" celebration once (e.g. after creating next cycle). */
  initialNewCycleCelebration?: boolean;
  /** Income events in this cycle (for display). */
  incomeEvents?: { sourceName: string; amount: number; date: string; payment_source: 'me' | 'partner' | 'joint' }[];
  /** When true, viewer is the partner — labels show "You" for partner and owner name for the other. */
  isPartner?: boolean;
  /** Owner's display name (when isPartner), for "other" label. */
  ownerDisplayName?: string | null;
}

type Payer = 'me' | 'partner' | 'both';

export function BlueprintClient({
  household,
  paycycle,
  seeds,
  pots,
  repayments,
  allPaycycles,
  activePaycycleId,
  hasDraftCycle,
  userAvatarUrl,
  avatarEnabled = false,
  initialEditSeedId = null,
  initialNewCycleCelebration = false,
  incomeEvents = [],
  isPartner = false,
  ownerDisplayName = null,
}: BlueprintClientProps) {
  const router = useRouter();
  const otherLabel = isPartner
    ? (ownerDisplayName?.trim() || 'Account owner')
    : (household.partner_name?.trim() || 'Partner');
  const [isAddSeedOpen, setIsAddSeedOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'need' | 'want' | 'savings' | 'repay' | null
  >(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [isRatioDialogOpen, setIsRatioDialogOpen] = useState(false);
  const [seedToDelete, setSeedToDelete] = useState<Seed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  /** Current cycle = active: payment checkboxes and progress are always shown. Draft = planning only. */
  const isActiveCycle = paycycle.status === 'active';
  /** Optimistic paid: seed IDs we just marked paid (non-joint or 'both') */
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());
  /** Optimistic unpaid: seed IDs we just unmarked (non-joint or 'both') */
  const [optimisticUnpaidIds, setOptimisticUnpaidIds] = useState<Set<string>>(new Set());
  /** Joint bills: optimistic "marked by me" so one checkbox doesn't flip both */
  const [optimisticPaidMeIds, setOptimisticPaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticPaidPartnerIds, setOptimisticPaidPartnerIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidMeIds, setOptimisticUnpaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidPartnerIds, setOptimisticUnpaidPartnerIds] = useState<Set<string>>(new Set());
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  const displaySeeds = useMemo(() => {
    return seeds.map((s) => {
      const isJoint = s.payment_source === 'joint' && household.is_couple;
      if (isJoint) {
        const isPaidMe = (s.is_paid_me || optimisticPaidMeIds.has(s.id)) && !optimisticUnpaidMeIds.has(s.id);
        const isPaidPartner = (s.is_paid_partner || optimisticPaidPartnerIds.has(s.id)) && !optimisticUnpaidPartnerIds.has(s.id);
        return {
          ...s,
          is_paid_me: isPaidMe,
          is_paid_partner: isPaidPartner,
          is_paid: isPaidMe && isPaidPartner,
        };
      }
      if (optimisticUnpaidIds.has(s.id)) {
        return { ...s, is_paid: false, is_paid_me: false, is_paid_partner: false };
      }
      if (optimisticPaidIds.has(s.id)) {
        return { ...s, is_paid: true, is_paid_me: true, is_paid_partner: s.is_paid_partner };
      }
      return s;
    });
  }, [
    seeds,
    optimisticPaidIds,
    optimisticUnpaidIds,
    optimisticPaidMeIds,
    optimisticPaidPartnerIds,
    optimisticUnpaidMeIds,
    optimisticUnpaidPartnerIds,
    household.is_couple,
  ]);

  const totalSeeds = displaySeeds.length;
  const paidSeeds = displaySeeds.filter((s) => s.is_paid).length;
  const progressPercent =
    totalSeeds > 0 ? (paidSeeds / totalSeeds) * 100 : 0;
  const allPaid = paidSeeds === totalSeeds && totalSeeds > 0;
  const ritualClosedAt = (paycycle as { ritual_closed_at?: string | null }).ritual_closed_at ?? null;
  const isCycleLocked = !!ritualClosedAt;
  const [isClosingRitual, setIsClosingRitual] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showNewCycleCelebration, setShowNewCycleCelebration] = useState(initialNewCycleCelebration);

  useEffect(() => {
    if (!initialEditSeedId || seeds.length === 0) return;
    const seed = seeds.find((s) => s.id === initialEditSeedId);
    if (seed) {
      setEditingSeed(seed);
      setSelectedCategory(seed.type);
      setIsAddSeedOpen(true);
    }
  }, [initialEditSeedId, seeds]);

  const handleNewCycleCelebrationClose = () => {
    setShowNewCycleCelebration(false);
    router.replace('/dashboard/blueprint?cycle=' + paycycle.id, { scroll: false });
  };

  useEffect(() => {
    setOptimisticPaidIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.is_paid) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (!s.is_paid) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticPaidMeIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && s.is_paid_me) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticPaidPartnerIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && s.is_paid_partner) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidMeIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && !s.is_paid_me) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidPartnerIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && !s.is_paid_partner) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [seeds]);

  const handleCycleChange = (cycleId: string) => {
    router.push(`/dashboard/blueprint?cycle=${cycleId}`);
  };

  const handleAddSeed = (category: 'need' | 'want' | 'savings' | 'repay') => {
    setSelectedCategory(category);
    setEditingSeed(null);
    setIsAddSeedOpen(true);
  };

  const handleEditSeed = (seed: Seed) => {
    setEditingSeed(seed);
    setSelectedCategory(seed.type);
    setIsAddSeedOpen(true);
  };

  const handleDeleteClick = (seed: Seed) => {
    setSeedToDelete(seed);
  };

  const handleConfirmDelete = async () => {
    if (!seedToDelete) return;
    setIsDeleting(true);
    const result = await deleteSeed(seedToDelete.id);
    setIsDeleting(false);
    if (!result.error) {
      setSeedToDelete(null);
      router.refresh();
    }
  };

  const handleCreateNext = async () => {
    const result = await createNextPaycycle(paycycle.id);
    if (result.cycleId) {
      router.push(`/dashboard/blueprint?cycle=${result.cycleId}&newCycle=1`);
      router.refresh();
    }
  };

  const handleResyncDraft = async () => {
    if (!activePaycycleId) return;
    const result = await resyncDraftFromActive(paycycle.id, activePaycycleId);
    if (!result.error) {
      router.refresh();
    }
  };

  const handleMarkPaid = async (seedId: string, payer: Payer) => {
    const seed = seeds.find((s) => s.id === seedId);
    const isJoint = seed?.payment_source === 'joint' && household.is_couple;
    if (isJoint && (payer === 'me' || payer === 'partner')) {
      if (payer === 'me') {
        setOptimisticPaidMeIds((prev) => new Set(prev).add(seedId));
        setOptimisticUnpaidMeIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      } else {
        setOptimisticPaidPartnerIds((prev) => new Set(prev).add(seedId));
        setOptimisticUnpaidPartnerIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      }
    } else {
      setOptimisticPaidIds((prev) => new Set(prev).add(seedId));
      setOptimisticUnpaidIds((prev) => {
        const next = new Set(prev);
        next.delete(seedId);
        return next;
      });
    }
    const result = await markSeedPaid(seedId, payer);
    if ('success' in result) {
      router.refresh();
    } else {
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticPaidMeIds((prev) => {
            const next = new Set(prev);
            next.delete(seedId);
            return next;
          });
        } else {
          setOptimisticPaidPartnerIds((prev) => {
            const next = new Set(prev);
            next.delete(seedId);
            return next;
          });
        }
      } else {
        setOptimisticPaidIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      }
    }
  };

  const handleUnmarkPaid = async (seedId: string, payer: Payer) => {
    const seed = seeds.find((s) => s.id === seedId);
    const isJoint = seed?.payment_source === 'joint' && household.is_couple;
    if (isJoint && (payer === 'me' || payer === 'partner')) {
      if (payer === 'me') {
        setOptimisticUnpaidMeIds((prev) => new Set(prev).add(seedId));
        setOptimisticPaidMeIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      } else {
        setOptimisticUnpaidPartnerIds((prev) => new Set(prev).add(seedId));
        setOptimisticPaidPartnerIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      }
    } else {
      setOptimisticUnpaidIds((prev) => new Set(prev).add(seedId));
      setOptimisticPaidIds((prev) => {
        const next = new Set(prev);
        next.delete(seedId);
        return next;
      });
    }
    const result = await unmarkSeedPaid(seedId, payer);
    if ('success' in result) {
      router.refresh();
    } else {
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticUnpaidMeIds((prev) => {
            const next = new Set(prev);
            next.delete(seedId);
            return next;
          });
        } else {
          setOptimisticUnpaidPartnerIds((prev) => {
            const next = new Set(prev);
            next.delete(seedId);
            return next;
          });
        }
      } else {
        setOptimisticUnpaidIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      }
    }
  };

  const needSeeds = displaySeeds.filter((s) => s.type === 'need');
  const wantSeeds = displaySeeds.filter((s) => s.type === 'want');
  const savingsSeeds = displaySeeds.filter((s) => s.type === 'savings');
  const repaySeeds = displaySeeds.filter((s) => s.type === 'repay');

  return (
    <div className="min-h-screen bg-background">
      <BlueprintHeader
        paycycle={paycycle}
        household={household}
        allPaycycles={allPaycycles}
        onCycleChange={handleCycleChange}
        onCreateNext={!hasDraftCycle ? handleCreateNext : undefined}
        onResyncDraft={
          paycycle.status === 'draft' && activePaycycleId
            ? handleResyncDraft
            : undefined
        }
        paidProgress={{
          paid: paidSeeds,
          total: totalSeeds,
          percent: progressPercent,
        }}
      />

      <main className="content-wrapper section-padding" id="main-content">
        <div className="space-y-8">
          {isActiveCycle && allPaid && !ritualClosedAt && (
            <CloseCycleRitual
              onComplete={async () => {
                setIsClosingRitual(true);
                try {
                  const result = await closeRitual(paycycle.id);
                  if ('success' in result) {
                    setShowCelebration(true);
                    router.refresh();
                  } else {
                    toast.error(result.error ?? 'Couldn’t close cycle');
                  }
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Couldn’t close cycle');
                } finally {
                  setIsClosingRitual(false);
                }
              }}
              isCompleting={isClosingRitual}
            />
          )}

          {isActiveCycle && isCycleLocked && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-heading text-sm uppercase tracking-wider text-foreground">
                Cycle closed — budget locked for this month
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsUnlocking(true);
                  const result = await unlockRitual(paycycle.id);
                  setIsUnlocking(false);
                  if ('success' in result) router.refresh();
                }}
                disabled={isUnlocking}
                className="text-sm font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded disabled:opacity-50"
              >
                {isUnlocking ? 'Unlocking…' : 'Unlock (e.g. new bill)'}
              </button>
            </div>
          )}

          {isActiveCycle && (
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden" role="region" aria-labelledby="blueprint-how-it-works">
              <button
                type="button"
                id="blueprint-how-it-works"
                onClick={() => setInstructionsExpanded((v) => !v)}
                className="w-full flex items-center justify-between gap-2 p-4 text-left font-heading text-sm uppercase tracking-wider text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-expanded={instructionsExpanded}
                aria-controls="blueprint-how-it-works-content"
              >
                How the Blueprint works
                {instructionsExpanded ? (
                  <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : (
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </button>
              <div
                id="blueprint-how-it-works-content"
                hidden={!instructionsExpanded}
                className="border-t border-border px-4 pb-4 pt-2"
              >
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Add or edit bills below. Click a bill to change it, or use the category buttons to add more.</li>
                  {household.is_couple && (
                    <li>On payday, transfer the amounts shown in Payday Transfers so the right money is in the right place.</li>
                  )}
                  <li>Mark each bill as paid using the checkboxes as you pay it. Bills with a due date are marked as paid automatically once that date has passed.</li>
                </ul>
              </div>
            </div>
          )}

          {isActiveCycle && household.is_couple && (
            <RitualTransferSummary
              seeds={displaySeeds}
              household={household}
              userAvatarUrl={userAvatarUrl}
              avatarEnabled={avatarEnabled}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />
          )}

          <TotalAllocatedSummary paycycle={paycycle} />

          <IncomeThisCycle
            total={paycycle.total_income}
            events={incomeEvents}
          />

          <CategorySummaryGrid
            paycycle={paycycle}
            household={household}
            onEditRatios={() => setIsRatioDialogOpen(true)}
          />

          {household.is_couple && !isActiveCycle && (
            <JointAccountSummary
              household={household}
              seeds={seeds}
              userAvatarUrl={userAvatarUrl}
              avatarEnabled={avatarEnabled}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />
          )}

          <div className="space-y-8">
            <SeedsList
              category="need"
              seeds={needSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              isRitualMode={isActiveCycle}
              isCycleLocked={isCycleLocked}
              onAdd={() => handleAddSeed('need')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
              onMarkPaid={handleMarkPaid}
              onUnmarkPaid={handleUnmarkPaid}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />

            <SeedsList
              category="want"
              seeds={wantSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              isRitualMode={isActiveCycle}
              isCycleLocked={isCycleLocked}
              onAdd={() => handleAddSeed('want')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
              onMarkPaid={handleMarkPaid}
              onUnmarkPaid={handleUnmarkPaid}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />

            <SeedsList
              category="savings"
              seeds={savingsSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              isRitualMode={isActiveCycle}
              isCycleLocked={isCycleLocked}
              onAdd={() => handleAddSeed('savings')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
              onMarkPaid={handleMarkPaid}
              onUnmarkPaid={handleUnmarkPaid}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />

            <SeedsList
              category="repay"
              seeds={repaySeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              isRitualMode={isActiveCycle}
              isCycleLocked={isCycleLocked}
              onAdd={() => handleAddSeed('repay')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
              onMarkPaid={handleMarkPaid}
              onUnmarkPaid={handleUnmarkPaid}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />
          </div>
        </div>
      </main>

      <CategoryRatioDialog
        open={isRatioDialogOpen}
        onOpenChange={setIsRatioDialogOpen}
        household={household}
        onSuccess={() => router.refresh()}
      />

      <SeedDialog
        open={isAddSeedOpen}
        onOpenChange={setIsAddSeedOpen}
        category={selectedCategory}
        seed={editingSeed}
        household={household}
        paycycle={paycycle}
        pots={pots}
        repayments={repayments}
        onSuccess={() => {
          setIsAddSeedOpen(false);
          setEditingSeed(null);
          setSelectedCategory(null);
          router.refresh();
        }}
        isPartner={isPartner}
        otherLabel={otherLabel}
      />

      <DeleteSeedConfirmDialog
        seed={seedToDelete}
        open={!!seedToDelete}
        onOpenChange={(open) => !open && setSeedToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <RitualCompletionCelebration
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        totalAllocated={paycycle.total_allocated}
        totalIncome={paycycle.total_income}
      />

      <NewCycleCelebration
        open={showNewCycleCelebration}
        onClose={handleNewCycleCelebrationClose}
      />
    </div>
  );
}
