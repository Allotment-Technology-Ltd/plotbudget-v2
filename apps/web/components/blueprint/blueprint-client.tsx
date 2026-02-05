'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlueprintHeader } from './blueprint-header';
import { CategorySummaryGrid } from './category-summary-grid';
import { TotalAllocatedSummary } from './total-allocated-summary';
import { CategoryRatioDialog } from './category-ratio-dialog';
import { JointAccountSummary } from './joint-account-summary';
import { SeedsList } from './seeds-list';
import { SeedDialog } from './seed-dialog';
import { DeleteSeedConfirmDialog } from './delete-seed-confirm-dialog';
import {
  deleteSeed,
  createNextPaycycle,
  resyncDraftFromActive,
} from '@/lib/actions/seed-actions';
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
}: BlueprintClientProps) {
  const router = useRouter();
  const [isAddSeedOpen, setIsAddSeedOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'need' | 'want' | 'savings' | 'repay' | null
  >(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [isRatioDialogOpen, setIsRatioDialogOpen] = useState(false);
  const [seedToDelete, setSeedToDelete] = useState<Seed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      router.push(`/dashboard/blueprint?cycle=${result.cycleId}`);
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

  const needSeeds = seeds.filter((s) => s.type === 'need');
  const wantSeeds = seeds.filter((s) => s.type === 'want');
  const savingsSeeds = seeds.filter((s) => s.type === 'savings');
  const repaySeeds = seeds.filter((s) => s.type === 'repay');

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
      />

      <main className="content-wrapper section-padding" id="main-content">
        <div className="space-y-8">
          <TotalAllocatedSummary paycycle={paycycle} />

          <CategorySummaryGrid
            paycycle={paycycle}
            household={household}
            onEditRatios={() => setIsRatioDialogOpen(true)}
          />

          {household.is_couple && (
            <JointAccountSummary household={household} seeds={seeds} />
          )}

          <div className="space-y-8">
            <SeedsList
              category="need"
              seeds={needSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              onAdd={() => handleAddSeed('need')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
            />

            <SeedsList
              category="want"
              seeds={wantSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              onAdd={() => handleAddSeed('want')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
            />

            <SeedsList
              category="savings"
              seeds={savingsSeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              onAdd={() => handleAddSeed('savings')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
            />

            <SeedsList
              category="repay"
              seeds={repaySeeds}
              household={household}
              paycycle={paycycle}
              pots={pots}
              repayments={repayments}
              onAdd={() => handleAddSeed('repay')}
              onEdit={handleEditSeed}
              onDelete={handleDeleteClick}
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
      />

      <DeleteSeedConfirmDialog
        seed={seedToDelete}
        open={!!seedToDelete}
        onOpenChange={(open) => !open && setSeedToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
