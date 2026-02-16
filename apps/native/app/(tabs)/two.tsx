import { ScrollView, View, RefreshControl, Pressable, Alert } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,
  Section,
  Card,
  Text,
  SubheadingText,
  BodyText,
  LabelText,
  useTheme,
} from '@repo/native-ui';
import { BlueprintSkeleton } from '@/components/BlueprintSkeleton';
import { ErrorScreen } from '@/components/ErrorScreen';
import { SeedFormModal } from '@/components/SeedFormModal';
import { DeleteSeedConfirmModal } from '@/components/DeleteSeedConfirmModal';
import { IncomeManageModal } from '@/components/IncomeManageModal';
import { CyclePickerSheet } from '@/components/CyclePickerSheet';
import { SeedCard } from '@/components/SeedCard';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { hapticImpact, hapticSuccess } from '@/lib/haptics';
import { format } from 'date-fns';
import { formatCurrency, type CurrencyCode } from '@repo/logic';
import type { Seed, Pot, PayCycle, Household, Repayment } from '@repo/supabase';
import { fetchBlueprintData, type IncomeSource as BlueprintIncomeSource, type PaycycleOption } from '@/lib/blueprint-data';
import { markPotComplete } from '@/lib/mark-pot-complete';
import { markSeedPaid, unmarkSeedPaid, type Payer } from '@/lib/mark-seed-paid';
import { markOverdueSeedsPaid } from '@/lib/mark-overdue-seeds';
import { deleteSeedApi } from '@/lib/seed-api';
import { createNextPaycycle, closeRitual, unlockRitual, resyncDraft } from '@/lib/paycycle-api';

type SeedType = 'need' | 'want' | 'savings' | 'repay';
type PotStatus = 'active' | 'complete' | 'paused';

const CATEGORY_LABELS: Record<SeedType, string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repayments',
};

const CATEGORY_SINGULAR: Record<SeedType, string> = {
  need: 'Need',
  want: 'Want',
  savings: 'Saving',
  repay: 'Repayment',
};

function PotCard({
  pot,
  currency,
  colors,
  spacing,
  borderRadius,
  effectiveStatus,
  onMarkComplete,
}: {
  pot: Pot;
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
  effectiveStatus: PotStatus;
  onMarkComplete: (potId: string, status: 'complete' | 'active') => void;
}) {
  const progress =
    pot.target_amount > 0
      ? Math.min(100, (pot.current_amount / pot.target_amount) * 100)
      : 0;
  const status =
    effectiveStatus === 'complete'
      ? 'Accomplished'
      : effectiveStatus === 'paused'
        ? 'Paused'
        : 'Saving';
  const canToggle =
    effectiveStatus === 'active' || effectiveStatus === 'complete' || effectiveStatus === 'paused';
  const nextStatus = effectiveStatus === 'complete' ? 'active' : 'complete';

  return (
    <Pressable
      onPress={canToggle ? () => { hapticImpact('light'); onMarkComplete(pot.id, nextStatus); } : undefined}
      disabled={!canToggle}>
      <Card variant="default" padding="md" style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <BodyText style={{ fontSize: 20 }}>{pot.icon || '🏖️'}</BodyText>
          <LabelText>{pot.name}</LabelText>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
          {formatCurrency(pot.current_amount, currency)} / {formatCurrency(pot.target_amount, currency)}
        </Text>
        <View
          style={{
            height: 8,
            backgroundColor: colors.borderSubtle,
            borderRadius: borderRadius.full,
            overflow: 'hidden',
            marginBottom: spacing.xs,
          }}>
          <View
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: colors.savings,
              borderRadius: borderRadius.full,
            }}
          />
        </View>
        <Text variant="label-sm" color="secondary">
          {progress.toFixed(0)}% — {status}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function BlueprintScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const [data, setData] = useState<{
    household: Household | null;
    paycycle: PayCycle | null;
    seeds: Seed[];
    pots: Pot[];
    repayments: Repayment[];
    incomeSources: BlueprintIncomeSource[];
    isPartner: boolean;
    allPaycycles: PaycycleOption[];
    activePaycycleId: string | null;
    hasDraftCycle: boolean;
  } | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const selectedCycleIdRef = useRef<string | null>(null);
  selectedCycleIdRef.current = selectedCycleId;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isClosingRitual, setIsClosingRitual] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCreatingNext, setIsCreatingNext] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);
  const [cyclePickerVisible, setCyclePickerVisible] = useState(false);
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidIds, setOptimisticUnpaidIds] = useState<Set<string>>(new Set());
  const [optimisticPaidMeIds, setOptimisticPaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticPaidPartnerIds, setOptimisticPaidPartnerIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidMeIds, setOptimisticUnpaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidPartnerIds, setOptimisticUnpaidPartnerIds] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, PotStatus>>({});
  const [formCategory, setFormCategory] = useState<SeedType | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [seedToDelete, setSeedToDelete] = useState<Seed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = useCallback(async (cycleId?: string | null) => {
    setError(null);
    const idToLoad = cycleId !== undefined ? cycleId : selectedCycleIdRef.current;
    try {
      const result = await fetchBlueprintData({ selectedCycleId: idToLoad ?? undefined });
      const paycycle = result.paycycle;
      if (paycycle?.status === 'active') {
        try {
          const overdueResult = await markOverdueSeedsPaid(paycycle.id);
          if ('success' in overdueResult) {
            const refetch = await fetchBlueprintData({ selectedCycleId: idToLoad ?? undefined });
            setData({
              household: refetch.household,
              paycycle: refetch.paycycle,
              seeds: refetch.seeds,
              pots: refetch.pots,
              repayments: refetch.repayments,
              incomeSources: refetch.incomeSources,
              isPartner: refetch.isPartner,
              allPaycycles: refetch.allPaycycles,
              activePaycycleId: refetch.activePaycycleId,
              hasDraftCycle: refetch.hasDraftCycle,
            });
            setSelectedCycleId(refetch.paycycle?.id ?? null);
            return;
          }
        } catch (err) {
          if (__DEV__) console.warn('[Blueprint] markOverdueSeedsPaid failed (showing blueprint anyway):', err);
        }
        setData({
          household: result.household,
          paycycle: result.paycycle,
          seeds: result.seeds,
          pots: result.pots,
          repayments: result.repayments,
          incomeSources: result.incomeSources,
          isPartner: result.isPartner,
          allPaycycles: result.allPaycycles,
          activePaycycleId: result.activePaycycleId,
          hasDraftCycle: result.hasDraftCycle,
        });
        setSelectedCycleId(result.paycycle?.id ?? null);
      } else {
        setData({
          household: result.household,
          paycycle: result.paycycle,
          seeds: result.seeds,
          pots: result.pots,
          repayments: result.repayments,
          incomeSources: result.incomeSources,
          isPartner: result.isPartner,
          allPaycycles: result.allPaycycles,
          activePaycycleId: result.activePaycycleId,
          hasDraftCycle: result.hasDraftCycle,
        });
        setSelectedCycleId(result.paycycle?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load Blueprint'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const seeds = data?.seeds ?? [];
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
  }, [data?.seeds]);

  const displaySeeds = useMemo(() => {
    const seeds = data?.seeds ?? [];
    const household = data?.household as { is_couple?: boolean } | null;
    return seeds.map((s) => {
      const isJoint = s.payment_source === 'joint' && household?.is_couple;
      if (isJoint) {
        const isPaidMe = (s.is_paid_me || optimisticPaidMeIds.has(s.id)) && !optimisticUnpaidMeIds.has(s.id);
        const isPaidPartner = (s.is_paid_partner || optimisticPaidPartnerIds.has(s.id)) && !optimisticUnpaidPartnerIds.has(s.id);
        return { ...s, is_paid_me: isPaidMe, is_paid_partner: isPaidPartner, is_paid: isPaidMe && isPaidPartner };
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
    data?.seeds,
    data?.household,
    optimisticPaidIds,
    optimisticUnpaidIds,
    optimisticPaidMeIds,
    optimisticPaidPartnerIds,
    optimisticUnpaidMeIds,
    optimisticUnpaidPartnerIds,
  ]);

  const seedsByCategory = useMemo(
    () =>
      (displaySeeds ?? []).reduce(
        (acc, s) => {
          const t = s.type as SeedType;
          if (!acc[t]) acc[t] = [];
          acc[t].push(s);
          return acc;
        },
        {} as Record<SeedType, Seed[]>
      ),
    [displaySeeds]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
  }, [loadData]);

  const handleMarkComplete = useCallback(
    async (potId: string, status: 'complete' | 'active') => {
      const pot = data?.pots.find((p) => p.id === potId);
      const prevStatus = (pot?.status ?? 'active') as PotStatus;
      setOptimisticStatus((s) => ({ ...s, [potId]: status }));
      const result = await markPotComplete(potId, status);
      if ('success' in result) {
        if (status === 'complete') {
          hapticSuccess();
          setShowSuccess(true);
        }
        await loadData();
        setOptimisticStatus((s) => {
          const next = { ...s };
          delete next[potId];
          return next;
        });
      } else {
        setOptimisticStatus((s) => {
          const next = { ...s };
          next[potId] = prevStatus;
          return next;
        });
        Alert.alert('Couldn’t update pot', result.error ?? 'Something went wrong. Try again.');
      }
    },
    [data?.pots, loadData]
  );

  const handleMarkSeedPaid = useCallback(
    async (seedId: string, payer: Payer) => {
      const seed = data?.seeds.find((s) => s.id === seedId);
      const isJoint = seed?.payment_source === 'joint' && (data?.household as { is_couple?: boolean })?.is_couple;
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticPaidMeIds((p) => new Set(p).add(seedId));
          setOptimisticUnpaidMeIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        } else {
          setOptimisticPaidPartnerIds((p) => new Set(p).add(seedId));
          setOptimisticUnpaidPartnerIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      } else {
        setOptimisticPaidIds((p) => new Set(p).add(seedId));
        setOptimisticUnpaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      }
      const result = await markSeedPaid(seedId, payer);
      if ('success' in result) {
        hapticSuccess();
        setShowSuccess(true);
        await loadData();
        setOptimisticPaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
        setOptimisticPaidMeIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
        setOptimisticPaidPartnerIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      } else {
        if (isJoint && (payer === 'me' || payer === 'partner')) {
          if (payer === 'me') {
            setOptimisticPaidMeIds((p) => {
              const n = new Set(p);
              n.delete(seedId);
              return n;
            });
          } else {
            setOptimisticPaidPartnerIds((p) => {
              const n = new Set(p);
              n.delete(seedId);
              return n;
            });
          }
        } else {
          setOptimisticPaidIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
        Alert.alert('Couldn’t mark as paid', result.error ?? 'Something went wrong. Try again.');
      }
    },
    [data?.seeds, data?.household, loadData]
  );

  const handleUnmarkSeedPaid = useCallback(
    async (seedId: string, payer: Payer) => {
      const seed = data?.seeds.find((s) => s.id === seedId);
      const isJoint = seed?.payment_source === 'joint' && (data?.household as { is_couple?: boolean })?.is_couple;
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticUnpaidMeIds((p) => new Set(p).add(seedId));
          setOptimisticPaidMeIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        } else {
          setOptimisticUnpaidPartnerIds((p) => new Set(p).add(seedId));
          setOptimisticPaidPartnerIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      } else {
        setOptimisticUnpaidIds((p) => new Set(p).add(seedId));
        setOptimisticPaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      }
      const result = await unmarkSeedPaid(seedId, payer);
      if ('success' in result) {
        await loadData();
        setOptimisticUnpaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
        setOptimisticUnpaidMeIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
        setOptimisticUnpaidPartnerIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      } else {
        if (isJoint && (payer === 'me' || payer === 'partner')) {
          if (payer === 'me') {
            setOptimisticUnpaidMeIds((p) => {
              const n = new Set(p);
              n.delete(seedId);
              return n;
            });
          } else {
            setOptimisticUnpaidPartnerIds((p) => {
              const n = new Set(p);
              n.delete(seedId);
              return n;
            });
          }
        } else {
          setOptimisticUnpaidIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
        Alert.alert('Couldn’t unmark paid', result.error ?? 'Something went wrong. Try again.');
      }
    },
    [data?.seeds, data?.household, loadData]
  );

  const handleDeleteSeed = useCallback(async () => {
    if (!seedToDelete) return;
    setIsDeleting(true);
    const result = await deleteSeedApi(seedToDelete.id);
    setIsDeleting(false);
    if ('success' in result) {
      setSeedToDelete(null);
      await loadData();
    }
  }, [seedToDelete, loadData]);

  const openAddForm = (category: SeedType) => {
    setFormCategory(category);
    setEditingSeed(null);
  };

  const openEditForm = (seed: Seed) => {
    setFormCategory(seed.type as SeedType);
    setEditingSeed(seed);
  };

  if (loading && !data) {
    return <BlueprintSkeleton />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Couldn't load Blueprint"
        message={error.message}
        onRetry={() => {
          setLoading(true);
          setError(null);
          loadData();
        }}
      />
    );
  }

  if (!data?.household) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <Text variant="headline-sm" style={{ marginBottom: spacing.sm }}>Your Blueprint</Text>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                Sign in to view your Blueprint
              </BodyText>
              <Text variant="body-sm" color="secondary" style={{ textAlign: 'center' }}>
                Complete onboarding on the web app, then sign in here.
              </Text>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const currency: CurrencyCode = (data.household.currency ?? 'GBP') as CurrencyCode;
  const hasPaycycle = !!data.paycycle;
  const isRitualMode = data.paycycle?.status === 'active';
  const ritualClosedAt = (data.paycycle as { ritual_closed_at?: string | null })?.ritual_closed_at ?? null;
  const isCycleLocked = !!ritualClosedAt;
  const otherLabel = data.isPartner ? 'Account owner' : 'Partner';

  const categories: SeedType[] = ['need', 'want', 'savings', 'repay'];

  const paycycle = data.paycycle as PayCycle & {
    alloc_needs_me?: number; alloc_needs_partner?: number; alloc_needs_joint?: number;
    alloc_wants_me?: number; alloc_wants_partner?: number; alloc_wants_joint?: number;
    alloc_savings_me?: number; alloc_savings_partner?: number; alloc_savings_joint?: number;
    alloc_repay_me?: number; alloc_repay_partner?: number; alloc_repay_joint?: number;
    rem_needs_me?: number; rem_needs_partner?: number; rem_needs_joint?: number;
    rem_wants_me?: number; rem_wants_partner?: number; rem_wants_joint?: number;
    rem_savings_me?: number; rem_savings_partner?: number; rem_savings_joint?: number;
    rem_repay_me?: number; rem_repay_partner?: number; rem_repay_joint?: number;
  } | null;
  const household = data.household as Household & {
    needs_percent?: number; wants_percent?: number; savings_percent?: number; repay_percent?: number;
  };

  const totalSeeds = displaySeeds.length;
  const paidSeeds = displaySeeds.filter((s) => s.is_paid).length;
  const progressPercent = totalSeeds > 0 ? Math.round((paidSeeds / totalSeeds) * 100) : 0;
  const allPaid = paidSeeds === totalSeeds && totalSeeds > 0;
  const totalIncome = Number(paycycle?.total_income ?? 0);

  const cycleLabel = (c: PaycycleOption) =>
    c.status === 'active' ? 'Current cycle' : c.status === 'draft' ? 'Next cycle' : format(new Date(c.start_date), 'MMM yyyy');

  const handleCycleSelect = (cycleId: string) => {
    setCyclePickerVisible(false);
    loadData(cycleId);
  };

  const handleCreateNext = async () => {
    if (!data?.paycycle || isCreatingNext) return;
    setIsCreatingNext(true);
    const result = await createNextPaycycle(data.paycycle.id);
    setIsCreatingNext(false);
    if ('cycleId' in result) {
      loadData(result.cycleId);
    } else {
      Alert.alert('Couldn’t create next cycle', result.error ?? 'Try again.');
    }
  };

  const handleResyncDraft = async () => {
    if (!data?.paycycle || !data.activePaycycleId || isResyncing) return;
    setIsResyncing(true);
    const result = await resyncDraft(data.paycycle.id, data.activePaycycleId);
    setIsResyncing(false);
    if ('success' in result) {
      loadData(data.paycycle.id);
    } else {
      Alert.alert('Couldn’t resync draft', result.error ?? 'Try again.');
    }
  };

  const handleCloseRitual = async () => {
    if (!data?.paycycle || isClosingRitual) return;
    setIsClosingRitual(true);
    const result = await closeRitual(data.paycycle.id);
    setIsClosingRitual(false);
    if ('success' in result) {
      loadData(data.paycycle!.id);
    } else {
      Alert.alert('Couldn’t close cycle', result.error ?? 'Try again.');
    }
  };

  const handleUnlockRitual = async () => {
    if (!data?.paycycle || isUnlocking) return;
    setIsUnlocking(true);
    const result = await unlockRitual(data.paycycle.id);
    setIsUnlocking(false);
    if ('success' in result) {
      loadData(data.paycycle!.id);
    } else {
      Alert.alert('Couldn’t unlock', result.error ?? 'Try again.');
    }
  };
  const totalAllocated = Number(paycycle?.total_allocated ?? 0);
  const allocationDifference = totalIncome - totalAllocated;

  const CATEGORY_GRID = [
    { key: 'needs' as const, label: 'Needs', percentKey: 'needs_percent' as const, allocKey: 'alloc_needs' as const, remKey: 'rem_needs' as const },
    { key: 'wants' as const, label: 'Wants', percentKey: 'wants_percent' as const, allocKey: 'alloc_wants' as const, remKey: 'rem_wants' as const },
    { key: 'savings' as const, label: 'Savings', percentKey: 'savings_percent' as const, allocKey: 'alloc_savings' as const, remKey: 'rem_savings' as const },
    { key: 'repay' as const, label: 'Repay', percentKey: 'repay_percent' as const, allocKey: 'alloc_repay' as const, remKey: 'rem_repay' as const },
  ] as const;

  return (
    <>
      <SuccessAnimation
        visible={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bgPrimary }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPrimary}
          />
        }>
        <Container paddingX="md">
          <Section spacing="xl">
            {!hasPaycycle ? (
              <>
                <Text variant="headline-sm" style={{ marginBottom: spacing.sm }}>Your Blueprint</Text>
                <Card variant="default" padding="lg">
                  <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                    No active pay cycle
                  </BodyText>
                  <Text variant="body-sm" color="secondary" style={{ textAlign: 'center' }}>
                    Create or activate a pay cycle on the web app to add bills.
                  </Text>
                </Card>
              </>
            ) : (
              <>
                {/* Header */}
                <Text variant="headline-sm" style={{ marginBottom: spacing.xs }}>Your Blueprint</Text>
                {/* Cycle selector + actions */}
                {data.allPaycycles.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                    <Pressable
                      onPress={() => { hapticImpact('light'); setCyclePickerVisible(true); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        minWidth: 160,
                      }}>
                      <BodyText numberOfLines={1} style={{ flex: 1 }}>
                        {paycycle ? cycleLabel(data.allPaycycles.find((p) => p.id === paycycle.id) ?? paycycle as PaycycleOption) : 'Select cycle'}
                      </BodyText>
                      <Text variant="label-sm" color="secondary">▼</Text>
                    </Pressable>
                    {isRitualMode && !data.hasDraftCycle && (
                      <Pressable
                        onPress={() => { hapticImpact('light'); handleCreateNext(); }}
                        disabled={isCreatingNext}
                        style={{
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.md,
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: colors.accentPrimary,
                        }}>
                        <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                          {isCreatingNext ? 'Creating…' : '+ Next cycle'}
                        </Text>
                      </Pressable>
                    )}
                    {data.paycycle?.status === 'draft' && data.activePaycycleId && (
                      <Pressable
                        onPress={() => { hapticImpact('light'); handleResyncDraft(); }}
                        disabled={isResyncing}
                        style={{
                          paddingVertical: spacing.sm,
                          paddingHorizontal: spacing.md,
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                        }}>
                        <Text variant="label-sm" color="secondary">
                          {isResyncing ? 'Resyncing…' : 'Resync from active'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm }}>
                  <Text variant="body-sm" color="secondary">
                    {paycycle ? `${format(new Date(paycycle.start_date), 'MMM d')} – ${format(new Date(paycycle.end_date), 'MMM d, yyyy')}` : ''}
                  </Text>
                  {isRitualMode && totalSeeds > 0 && (
                    <Text variant="body-sm" color="secondary">
                      {paidSeeds} of {totalSeeds} bills paid ({progressPercent}%)
                    </Text>
                  )}
                </View>
                <View style={{ height: 8, borderRadius: borderRadius.full, backgroundColor: colors.borderSubtle, overflow: 'hidden', marginBottom: spacing.lg }}>
                  {isRitualMode ? (
                    <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: colors.accentPrimary, borderRadius: borderRadius.full }} />
                  ) : (
                    <View style={{ height: '100%', width: 0 }} />
                  )}
                </View>

                {/* Close cycle ritual (same as web) */}
                {isRitualMode && allPaid && !isCycleLocked && (
                  <Card variant="default" padding="lg" style={{ marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accentPrimary + '50' }}>
                    <SubheadingText style={{ marginBottom: spacing.xs, textAlign: 'center' }}>All bills paid for this cycle</SubheadingText>
                    <BodyText color="secondary" style={{ marginBottom: spacing.md, textAlign: 'center', fontSize: 14 }}>
                      Close your cycle and lock your budget?
                    </BodyText>
                    <AnimatedPressable
                      onPress={handleCloseRitual}
                      disabled={isClosingRitual}
                      style={{
                        alignSelf: 'center',
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.lg,
                        borderRadius: borderRadius.full,
                        backgroundColor: colors.accentPrimary,
                      }}>
                      <Text variant="label-sm" style={{ color: colors.bgPrimary }}>
                        {isClosingRitual ? 'Closing…' : 'Close cycle'}
                      </Text>
                    </AnimatedPressable>
                  </Card>
                )}

                {/* Unlock cycle (same as web) */}
                {isRitualMode && isCycleLocked && (
                  <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
                    <BodyText style={{ marginBottom: spacing.sm }}>Cycle closed — budget locked for this month</BodyText>
                    <AnimatedPressable
                      onPress={handleUnlockRitual}
                      disabled={isUnlocking}
                      style={{ alignSelf: 'flex-start' }}>
                      <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                        {isUnlocking ? 'Unlocking…' : 'Unlock (e.g. new bill)'}
                      </Text>
                    </AnimatedPressable>
                  </Card>
                )}

                {/* Total allocated */}
                <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
                  <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>Total allocated</LabelText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <SubheadingText>{formatCurrency(totalAllocated, currency)}</SubheadingText>
                    <Text variant="body-sm" color="secondary">of</Text>
                    <Text variant="sub-sm">{formatCurrency(totalIncome, currency)}</Text>
                  </View>
                  <Text variant="body-sm"
                    style={{
                      color: allocationDifference > 0 ? colors.accentPrimary : allocationDifference < 0 ? colors.warning : colors.textSecondary,
                    }}>
                    {allocationDifference > 0
                      ? `${formatCurrency(allocationDifference, currency)} under`
                      : allocationDifference < 0
                        ? `${formatCurrency(Math.abs(allocationDifference), currency)} over`
                        : 'Fully allocated'}
                  </Text>
                </Card>

                {/* Income this cycle */}
                <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                    <Text variant="sub-sm">Income this cycle</Text>
                    <Pressable
                      onPress={() => { hapticImpact('light'); setIncomeModalVisible(true); }}
                      hitSlop={8}
                      style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.sm }}>
                      <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Manage</Text>
                    </Pressable>
                  </View>
                  <SubheadingText style={{ marginBottom: spacing.xs }}>
                    {formatCurrency(totalIncome, currency)}
                  </SubheadingText>
                  <Text variant="body-sm" color="secondary">
                    {data.incomeSources.length === 0
                      ? 'Add income sources to see pay dates and projected income.'
                      : `${data.incomeSources.filter((s) => s.is_active).length} source(s)`}
                  </Text>
                </Card>

                {/* Category summary grid */}
                {paycycle && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
                    {CATEGORY_GRID.map((cat) => {
                      const percent = household[cat.percentKey] ?? 50;
                      const target = totalIncome * (percent / 100);
                      const allocMe = Number(paycycle[`${cat.allocKey}_me`]) || 0;
                      const allocPartner = Number(paycycle[`${cat.allocKey}_partner`]) || 0;
                      const allocJoint = Number(paycycle[`${cat.allocKey}_joint`]) || 0;
                      const allocated = allocMe + allocPartner + allocJoint;
                      const remMe = Number(paycycle[`${cat.remKey}_me`]) || 0;
                      const remPartner = Number(paycycle[`${cat.remKey}_partner`]) || 0;
                      const remJoint = Number(paycycle[`${cat.remKey}_joint`]) || 0;
                      const remaining = remMe + remPartner + remJoint;
                      const catProgress = target > 0 ? Math.min((allocated / target) * 100, 100) : 0;
                      const isOver = target > 0 && allocated > target;
                      return (
                        <View key={cat.key} style={{ flex: 1, minWidth: '45%', maxWidth: '48%' }}>
                          <Card variant="default" padding="md" style={{ borderWidth: 1, borderColor: isOver ? colors.warning + '80' : colors.borderSubtle }}>
                            <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>{cat.label}</LabelText>
                            <Text variant="sub-sm" style={{ marginBottom: 2 }}>{formatCurrency(allocated, currency)}</Text>
                            <Text variant="label-sm" color="secondary" style={{ marginBottom: spacing.xs }}>
                              of {formatCurrency(target, currency)} ({percent}%){isOver ? ' — Over' : ''}
                            </Text>
                            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.borderSubtle, overflow: 'hidden', marginBottom: spacing.xs }}>
                              <View style={{ height: '100%', width: `${catProgress}%`, backgroundColor: isOver ? colors.warning : colors.accentPrimary, borderRadius: 3 }} />
                            </View>
                            <Text variant="label-sm" color="secondary">{formatCurrency(remaining, currency)} remaining</Text>
                          </Card>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Seed sections */}
                {categories.map((cat) => {
                  const seeds = seedsByCategory[cat] ?? [];
                  const paidInCat = seeds.filter((s) => s.is_paid).length;
                  return (
                    <Card key={cat} variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.md }}>
                        <View>
                          <Text variant="sub-sm">
                            {CATEGORY_LABELS[cat]} ({seeds.length})
                          </Text>
                          {isRitualMode && seeds.length > 0 && (
                            <Text variant="body-sm" color="secondary">
                              {paidInCat}/{seeds.length} paid
                            </Text>
                          )}
                        </View>
                        {!isCycleLocked && (
                          <Pressable
                            onPress={() => { hapticImpact('light'); openAddForm(cat); }}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: borderRadius.md,
                              borderWidth: 1,
                              borderColor: colors.borderSubtle,
                            }}>
                            <Text variant="body-sm">+ Add {CATEGORY_SINGULAR[cat]}</Text>
                          </Pressable>
                        )}
                      </View>
                      {seeds.length === 0 ? (
                        <Text variant="body-sm" color="secondary" style={{ textAlign: 'center', marginVertical: spacing.md }}>
                          No {CATEGORY_LABELS[cat].toLowerCase()} yet
                        </Text>
                      ) : (
                        seeds.map((seed) => {
                          const isJoint = !!(seed.payment_source === 'joint' && (data.household as { is_couple?: boolean })?.is_couple);
                          const canMarkUnmark = !isCycleLocked && isRitualMode;
                          return (
                            <SeedCard
                              key={seed.id}
                              seed={seed}
                              currency={currency}
                              isRitualMode={isRitualMode}
                              isCycleLocked={isCycleLocked}
                              isJoint={isJoint}
                              otherLabel={otherLabel}
                              onEdit={() => openEditForm(seed)}
                              onDelete={() => setSeedToDelete(seed)}
                              onMarkPaid={canMarkUnmark ? (payer) => handleMarkSeedPaid(seed.id, payer) : undefined}
                              onUnmarkPaid={canMarkUnmark ? (payer) => handleUnmarkSeedPaid(seed.id, payer) : undefined}
                            />
                          );
                        })
                      )}
                    </Card>
                  );
                })}

                {data.pots.length > 0 && (
                  <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
                    <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Savings pots</Text>
                    {data.pots.map((pot) => (
                      <PotCard
                        key={pot.id}
                        pot={pot}
                        currency={currency}
                        colors={colors}
                        spacing={spacing}
                        borderRadius={borderRadius}
                        effectiveStatus={(optimisticStatus[pot.id] ?? pot.status) as PotStatus}
                        onMarkComplete={handleMarkComplete}
                      />
                    ))}
                  </Card>
                )}
              </>
            )}
          </Section>
        </Container>
      </ScrollView>

      {formCategory && data.household && data.paycycle && (
        <SeedFormModal
          visible={!!formCategory}
          onClose={() => {
            setFormCategory(null);
            setEditingSeed(null);
          }}
          onSuccess={() => {
            loadData();
            setFormCategory(null);
            setEditingSeed(null);
          }}
          category={formCategory}
          seed={editingSeed}
          household={data.household}
          paycycle={data.paycycle}
          pots={data.pots}
          repayments={data.repayments}
        />
      )}

      <DeleteSeedConfirmModal
        visible={!!seedToDelete}
        seed={seedToDelete}
        onClose={() => setSeedToDelete(null)}
        onConfirm={handleDeleteSeed}
        isDeleting={isDeleting}
      />

      {data?.household && (
        <IncomeManageModal
          visible={incomeModalVisible}
          onClose={() => setIncomeModalVisible(false)}
          onSuccess={() => {
            loadData();
            setIncomeModalVisible(false);
          }}
          householdId={data.household.id}
          incomeSources={data.incomeSources}
          currency={(data.household.currency ?? 'GBP') as CurrencyCode}
          isPartner={data.isPartner}
        />
      )}

      <CyclePickerSheet
        visible={cyclePickerVisible}
        onClose={() => setCyclePickerVisible(false)}
        paycycles={data?.allPaycycles ?? []}
        selectedPaycycleId={data?.paycycle?.id ?? null}
        onSelect={handleCycleSelect}
      />
    </>
  );
}
