'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IncomeThisCycle } from '@/components/dashboard/income-this-cycle';
import { BlueprintHeader } from './blueprint-header';
import {
  CategorySummaryGrid,
  type BlueprintCategoryKey,
} from './category-summary-grid';
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
import { useBlueprintOptimisticPaid } from './use-blueprint-optimistic-paid';
import { useBlueprintDialogs } from './use-blueprint-dialogs';
import { useBlueprintCycleActions } from './use-blueprint-cycle-actions';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@repo/supabase';

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
  userInitials?: string;
  initialEditSeedId?: string | null;
  initialEditPotId?: string | null;
  initialEditRepaymentId?: string | null;
  initialNewCycleCelebration?: boolean;
  /** Calm Design Rule 7: Show greeting when ritual is ready (payday near, cycle not closed). */
  showRitualGreeting?: boolean;
  incomeEvents?: {
    sourceName: string;
    amount: number;
    date: string;
    payment_source: 'me' | 'partner' | 'joint';
  }[];
  isPartner?: boolean;
  ownerLabel?: string;
  partnerLabel?: string;
}

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
  userInitials = '?',
  initialEditSeedId = null,
  initialEditPotId = null,
  initialEditRepaymentId = null,
  initialNewCycleCelebration = false,
  showRitualGreeting = false,
  incomeEvents = [],
  isPartner = false,
  ownerLabel = 'Account owner',
  partnerLabel = 'Partner',
}: BlueprintClientProps) {
  const router = useRouter();
  const otherLabel = isPartner ? ownerLabel : partnerLabel;
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<
    BlueprintCategoryKey[]
  >([]);
  const [displayedCategoryFilters, setDisplayedCategoryFilters] = useState<
    BlueprintCategoryKey[]
  >([]);
  const handleFilterChange = (next: BlueprintCategoryKey[]) => {
    setSelectedCategoryFilters(next);
    startTransition(() => setDisplayedCategoryFilters(next));
  };
  const isSectionReady = (key: BlueprintCategoryKey) =>
    displayedCategoryFilters.length === 0 ||
    displayedCategoryFilters.includes(key);
  const CATEGORY_ORDER: BlueprintCategoryKey[] = [
    'need',
    'want',
    'savings',
    'repay',
  ];
  const requestedKeys: BlueprintCategoryKey[] =
    selectedCategoryFilters.length === 0
      ? CATEGORY_ORDER
      : CATEGORY_ORDER.filter((k) => selectedCategoryFilters.includes(k));

  const { displaySeeds, handleMarkPaid, handleUnmarkPaid } =
    useBlueprintOptimisticPaid(seeds, household);

  const {
    isAddSeedOpen,
    setIsAddSeedOpen,
    selectedCategory,
    editingSeed,
    isRatioDialogOpen,
    setIsRatioDialogOpen,
    seedToDelete,
    setSeedToDelete,
    isDeleting,
    showCelebration,
    setShowCelebration,
    instructionsExpanded,
    setInstructionsExpanded,
    showNewCycleCelebration,
    handleAddSeed,
    handleEditSeed,
    handleDeleteClick,
    handleConfirmDelete,
    handleSeedDialogSuccess,
    handleNewCycleCelebrationClose,
    handleCelebrationClose,
  } = useBlueprintDialogs({
    seeds,
    pots,
    repayments,
    initialEditSeedId,
    initialEditPotId,
    initialEditRepaymentId,
    initialNewCycleCelebration,
    paycycleId: paycycle.id,
    onRefresh: () => router.refresh(),
    onReplace: (url) => router.replace(url, { scroll: false }),
  });

  const {
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
  } = useBlueprintCycleActions({
    paycycleId: paycycle.id,
    activePaycycleId,
    onRefresh: () => router.refresh(),
    onShowCelebration: () => setShowCelebration(true),
  });

  const totalSeeds = displaySeeds.length;
  const paidSeeds = displaySeeds.filter((s) => s.is_paid).length;
  const progressPercent =
    totalSeeds > 0 ? (paidSeeds / totalSeeds) * 100 : 0;
  const allPaid = paidSeeds === totalSeeds && totalSeeds > 0;
  const ritualClosedAt = (paycycle as { ritual_closed_at?: string | null }).ritual_closed_at ?? null;
  const isCycleLocked = !!ritualClosedAt;
  const isActiveCycle = paycycle.status === 'active';

  const needSeeds = displaySeeds.filter((s) => s.type === 'need');
  const wantSeeds = displaySeeds.filter((s) => s.type === 'want');
  const savingsSeeds = displaySeeds.filter((s) => s.type === 'savings');
  const repaySeeds = displaySeeds.filter((s) => s.type === 'repay');

  const markPaid = (seedId: string, payer: 'me' | 'partner' | 'both') =>
    handleMarkPaid(seedId, payer, () => router.refresh());
  const unmarkPaid = (seedId: string, payer: 'me' | 'partner' | 'both') =>
    handleUnmarkPaid(seedId, payer, () => router.refresh());

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
        isCreatingCycle={isCreatingCycle}
        isResyncingDraft={isResyncingDraft}
        isSwitchingCycle={isSwitchingCycle}
        paidProgress={{
          paid: paidSeeds,
          total: totalSeeds,
          percent: progressPercent,
        }}
      />

      <main className="content-wrapper section-padding" id="main-content">
        {showRitualGreeting && !greetingDismissed ? (
          <div className="mx-auto max-w-md space-y-6 rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="font-heading text-xl font-semibold uppercase tracking-wider text-foreground">
              It&apos;s payday
            </h2>
            <p className="text-muted-foreground">
              Let&apos;s sort the month out together.
            </p>
            <Button
              type="button"
              onClick={() => setGreetingDismissed(true)}
              className="w-full"
            >
              Let&apos;s go
            </Button>
          </div>
        ) : (
        <div className="space-y-8">
          {isActiveCycle && allPaid && !ritualClosedAt && (
            <CloseCycleRitual
              onComplete={handleCloseRitual}
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
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="text-sm font-heading uppercase tracking-wider text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded disabled:opacity-50"
              >
                {isUnlocking ? 'Unlocking…' : 'Unlock (e.g. new bill)'}
              </button>
            </div>
          )}

          {isActiveCycle && (
            <div
              className="rounded-lg border border-border bg-muted/20 overflow-hidden"
              role="region"
              aria-labelledby="blueprint-how-it-works"
            >
              <button
                type="button"
                id="blueprint-how-it-works"
                onClick={() => setInstructionsExpanded((v) => !v)}
                className="w-full flex items-center justify-between gap-2 p-4 text-left font-heading text-sm uppercase tracking-wider text-foreground hover:bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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
                  <li>
                    Add or edit bills below. Click a bill to change it, or use
                    the category buttons to add more.
                  </li>
                  {household.is_couple && (
                    <li>
                      On payday, transfer the amounts shown in Payday Transfers
                      so the right money is in the right place.
                    </li>
                  )}
                  <li>
                    Mark each bill as paid using the checkboxes as you pay it.
                    Bills with a due date are marked as paid automatically once
                    that date has passed.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {isActiveCycle && household.is_couple && (
            <RitualTransferSummary
              seeds={displaySeeds}
              household={household}
              userAvatarUrl={userAvatarUrl}
              userInitials={userInitials}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />
          )}

          <TotalAllocatedSummary paycycle={paycycle} household={household} />

          <IncomeThisCycle
            total={paycycle.total_income}
            events={incomeEvents}
            currency={household.currency}
            ownerLabel={ownerLabel}
            partnerLabel={partnerLabel}
          />

          <CategorySummaryGrid
            paycycle={paycycle}
            household={household}
            onEditRatios={() => setIsRatioDialogOpen(true)}
            selectedFilters={selectedCategoryFilters}
            onFilterChange={handleFilterChange}
          />

          {household.is_couple && !isActiveCycle && (
            <JointAccountSummary
              household={household}
              seeds={seeds}
              userAvatarUrl={userAvatarUrl}
              userInitials={userInitials}
              isPartner={isPartner}
              otherLabel={otherLabel}
            />
          )}

          <div className="space-y-8">
            {requestedKeys.map((key) => {
              const ready = isSectionReady(key);
              const sectionLabel =
                key === 'need'
                  ? 'Needs'
                  : key === 'want'
                    ? 'Wants'
                    : key === 'savings'
                      ? 'Savings'
                      : 'Repayments';
              if (!ready) {
                return (
                  <div
                    key={key}
                    className="bg-card rounded-lg border border-border p-8 flex items-center justify-center min-h-[120px]"
                    role="status"
                    aria-live="polite"
                    data-testid={`blueprint-section-loading-${key}`}
                  >
                    <p className="text-sm text-muted-foreground">
                      Loading {sectionLabel}…
                    </p>
                  </div>
                );
              }
              const seeds =
                key === 'need'
                  ? needSeeds
                  : key === 'want'
                    ? wantSeeds
                    : key === 'savings'
                      ? savingsSeeds
                      : repaySeeds;
              return (
                <SeedsList
                  key={key}
                  category={key}
                  seeds={seeds}
                  household={household}
                  paycycle={paycycle}
                  pots={pots}
                  repayments={repayments}
                  isRitualMode={isActiveCycle}
                  isCycleLocked={isCycleLocked}
                  onAdd={() => handleAddSeed(key)}
                  onEdit={handleEditSeed}
                  onDelete={handleDeleteClick}
                  onMarkPaid={markPaid}
                  onUnmarkPaid={unmarkPaid}
                  isPartner={isPartner}
                  otherLabel={otherLabel}
                  ownerLabel={ownerLabel}
                  partnerLabel={partnerLabel}
                />
              );
            })}
          </div>
        </div>
        )}
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
        initialLinkPotId={
          initialEditPotId && !editingSeed ? initialEditPotId : undefined
        }
        initialLinkRepaymentId={
          initialEditRepaymentId && !editingSeed
            ? initialEditRepaymentId
            : undefined
        }
        onSuccess={handleSeedDialogSuccess}
        isPartner={isPartner}
        otherLabel={otherLabel}
        ownerLabel={ownerLabel}
        partnerLabel={partnerLabel}
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
        onClose={handleCelebrationClose}
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
