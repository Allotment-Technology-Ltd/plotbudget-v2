'use client';

import { useState, useEffect, useCallback } from 'react';
import { deleteSeed } from '@/lib/actions/seed-actions';
import type { Seed } from '@repo/supabase';
import type { Database } from '@repo/supabase';

type Pot = Database['public']['Tables']['pots']['Row'];
type Repayment = Database['public']['Tables']['repayments']['Row'];

export interface UseBlueprintDialogsParams {
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  initialEditSeedId?: string | null;
  initialEditPotId?: string | null;
  initialEditRepaymentId?: string | null;
  initialNewCycleCelebration?: boolean;
  paycycleId: string;
  onRefresh: () => void;
  onReplace: (url: string) => void;
}

export function useBlueprintDialogs({
  seeds,
  pots,
  repayments,
  initialEditSeedId = null,
  initialEditPotId = null,
  initialEditRepaymentId = null,
  initialNewCycleCelebration = false,
  paycycleId,
  onRefresh,
  onReplace,
}: UseBlueprintDialogsParams) {
  const [isAddSeedOpen, setIsAddSeedOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'need' | 'want' | 'savings' | 'repay' | null
  >(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [isRatioDialogOpen, setIsRatioDialogOpen] = useState(false);
  const [seedToDelete, setSeedToDelete] = useState<Seed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [showNewCycleCelebration, setShowNewCycleCelebration] = useState(
    initialNewCycleCelebration
  );

  useEffect(() => {
    if (initialEditSeedId && seeds.length > 0) {
      const seed = seeds.find((s) => s.id === initialEditSeedId);
      if (seed) {
        setEditingSeed(seed);
        setSelectedCategory(seed.type);
        setIsAddSeedOpen(true);
        return;
      }
    }
    if (initialEditPotId && pots.some((p) => p.id === initialEditPotId)) {
      setEditingSeed(null);
      setSelectedCategory('savings');
      setIsAddSeedOpen(true);
      return;
    }
    if (initialEditRepaymentId && repayments.some((r) => r.id === initialEditRepaymentId)) {
      setEditingSeed(null);
      setSelectedCategory('repay');
      setIsAddSeedOpen(true);
    }
  }, [
    initialEditSeedId,
    initialEditPotId,
    initialEditRepaymentId,
    seeds,
    pots,
    repayments,
  ]);

  const handleAddSeed = useCallback((category: 'need' | 'want' | 'savings' | 'repay') => {
    setSelectedCategory(category);
    setEditingSeed(null);
    setIsAddSeedOpen(true);
  }, []);

  const handleEditSeed = useCallback((seed: Seed) => {
    setEditingSeed(seed);
    setSelectedCategory(seed.type);
    setIsAddSeedOpen(true);
  }, []);

  const handleDeleteClick = useCallback((seed: Seed) => {
    setSeedToDelete(seed);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!seedToDelete) return;
    setIsDeleting(true);
    const result = await deleteSeed(seedToDelete.id);
    setIsDeleting(false);
    if (!result.error) {
      setSeedToDelete(null);
      onRefresh();
    }
  }, [seedToDelete, onRefresh]);

  const handleSeedDialogSuccess = useCallback(() => {
    setIsAddSeedOpen(false);
    setEditingSeed(null);
    setSelectedCategory(null);
    onReplace(`/dashboard/blueprint?cycle=${paycycleId}`);
    onRefresh();
  }, [paycycleId, onReplace, onRefresh]);

  const handleNewCycleCelebrationClose = useCallback(() => {
    setShowNewCycleCelebration(false);
    onReplace('/dashboard/blueprint?cycle=' + paycycleId);
  }, [paycycleId, onReplace]);

  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    onRefresh();
  }, [onRefresh]);

  return {
    isAddSeedOpen,
    setIsAddSeedOpen,
    selectedCategory,
    setSelectedCategory,
    editingSeed,
    setEditingSeed,
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
  };
}
