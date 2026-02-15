import { ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Section,
  Card,
  HeadlineText,
  BodyText,
  LabelText,
  useTheme,
} from '@repo/native-ui';
import { BlueprintSkeleton } from '@/components/BlueprintSkeleton';
import { ErrorScreen } from '@/components/ErrorScreen';
import { SeedFormModal } from '@/components/SeedFormModal';
import { DeleteSeedConfirmModal } from '@/components/DeleteSeedConfirmModal';
import { formatCurrency, currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Seed, Pot, PayCycle, Household, Repayment } from '@repo/supabase';
import { fetchBlueprintData } from '@/lib/blueprint-data';
import { markPotComplete } from '@/lib/mark-pot-complete';
import { markSeedPaid, unmarkSeedPaid, type Payer } from '@/lib/mark-seed-paid';
import { markOverdueSeedsPaid } from '@/lib/mark-overdue-seeds';
import { deleteSeedApi } from '@/lib/seed-api';

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

function SeedCard({
  seed,
  currency,
  colors,
  spacing,
  isRitualMode,
  isCycleLocked,
  isJoint,
  otherLabel,
  onEdit,
  onDelete,
  onMarkPaid,
  onUnmarkPaid,
}: {
  seed: Seed & { is_paid_me?: boolean; is_paid_partner?: boolean };
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  isRitualMode: boolean;
  isCycleLocked: boolean;
  isJoint: boolean;
  otherLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid?: (payer: Payer) => void;
  onUnmarkPaid?: (payer: Payer) => void;
}) {
  const isPaid = !!seed.is_paid;
  const isPaidMe = !!seed.is_paid_me;
  const isPaidPartner = !!seed.is_paid_partner;
  const canMarkUnmark = !isCycleLocked && isRitualMode && (onMarkPaid || onUnmarkPaid);
  const canEditOrDelete = !isCycleLocked && (!isRitualMode || !isPaid);

  const handleEdit = () => {
    if (!canEditOrDelete) return;
    onEdit();
  };

  const handleDelete = () => {
    if (!canEditOrDelete) return;
    onDelete();
  };

  return (
    <Pressable onPress={handleEdit} disabled={!canEditOrDelete}>
      <Card
        variant="default"
        padding="md"
        style={{
          marginBottom: spacing.sm,
          borderWidth: isPaid && isRitualMode ? 2 : 1,
          borderColor: isPaid && isRitualMode ? colors.accentPrimary + '80' : colors.borderSubtle,
          backgroundColor: isPaid && isRitualMode ? colors.accentPrimary + '0D' : undefined,
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <BodyText style={{ marginBottom: spacing.xs }}>{seed.name}</BodyText>
            <LabelText color="secondary">
              {currencySymbol(currency)}
              {Number(seed.amount).toFixed(2)}
              {isPaid ? ' • Paid' : ''}
            </LabelText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {canMarkUnmark &&
              (isJoint ? (
                <>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      (isPaidMe ? onUnmarkPaid : onMarkPaid)?.('me');
                    }}
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: isPaidMe ? colors.accentPrimary : colors.borderSubtle,
                      backgroundColor: isPaidMe ? colors.accentPrimary + '20' : undefined,
                    }}>
                    <LabelText
                      style={{
                        color: isPaidMe ? colors.accentPrimary : colors.textSecondary,
                        fontSize: 12,
                      }}>
                      You {isPaidMe ? '✓' : ''}
                    </LabelText>
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      (isPaidPartner ? onUnmarkPaid : onMarkPaid)?.('partner');
                    }}
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: isPaidPartner ? colors.accentPrimary : colors.borderSubtle,
                      backgroundColor: isPaidPartner ? colors.accentPrimary + '20' : undefined,
                    }}>
                    <LabelText
                      style={{
                        color: isPaidPartner ? colors.accentPrimary : colors.textSecondary,
                        fontSize: 12,
                      }}>
                      {otherLabel} {isPaidPartner ? '✓' : ''}
                    </LabelText>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    (isPaid ? onUnmarkPaid : onMarkPaid)?.('both');
                  }}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isPaid ? colors.accentPrimary : colors.borderSubtle,
                    backgroundColor: isPaid ? colors.accentPrimary + '20' : undefined,
                  }}>
                  <LabelText
                    style={{
                      color: isPaid ? colors.accentPrimary : colors.textSecondary,
                      fontSize: 12,
                    }}>
                    {isPaid ? 'Unmark paid' : 'Mark paid'}
                  </LabelText>
                </Pressable>
              ))}
            {canEditOrDelete && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.error,
                }}>
                <LabelText style={{ color: colors.error, fontSize: 12 }}>Delete</LabelText>
              </Pressable>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

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
      onPress={canToggle ? () => onMarkComplete(pot.id, nextStatus) : undefined}
      disabled={!canToggle}>
      <Card variant="default" padding="md" style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <BodyText style={{ fontSize: 20 }}>{pot.icon || '🏖️'}</BodyText>
          <LabelText>{pot.name}</LabelText>
        </View>
        <BodyText color="secondary" style={{ marginBottom: spacing.sm, fontSize: 14 }}>
          {formatCurrency(pot.current_amount, currency)} / {formatCurrency(pot.target_amount, currency)}
        </BodyText>
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
        <BodyText color="secondary" style={{ fontSize: 12 }}>
          {progress.toFixed(0)}% — {status}
        </BodyText>
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
    isPartner: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
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

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchBlueprintData();
      const paycycle = result.paycycle;
      if (paycycle?.status === 'active') {
        const overdueResult = await markOverdueSeedsPaid(paycycle.id);
        if ('success' in overdueResult) {
          const refetch = await fetchBlueprintData();
          setData({
            household: refetch.household,
            paycycle: refetch.paycycle,
            seeds: refetch.seeds,
            pots: refetch.pots,
            repayments: refetch.repayments,
            isPartner: refetch.isPartner,
          });
        } else {
          setData({
            household: result.household,
            paycycle: result.paycycle,
            seeds: result.seeds,
            pots: result.pots,
            repayments: result.repayments,
            isPartner: result.isPartner,
          });
        }
      } else {
        setData({
          household: result.household,
          paycycle: result.paycycle,
          seeds: result.seeds,
          pots: result.pots,
          repayments: result.repayments,
          isPartner: result.isPartner,
        });
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
            <HeadlineText style={{ marginBottom: spacing.md }}>Blueprint</HeadlineText>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                Sign in to view your Blueprint
              </BodyText>
              <BodyText color="secondary" style={{ textAlign: 'center' }}>
                Complete onboarding on the web app, then sign in here.
              </BodyText>
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

  return (
    <>
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
            <HeadlineText style={{ marginBottom: spacing.lg }}>Blueprint</HeadlineText>
            <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
              Needs, wants, savings, and repayments
            </BodyText>

            {!hasPaycycle ? (
              <Card variant="default" padding="lg">
                <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                  No active pay cycle
                </BodyText>
                <BodyText color="secondary" style={{ textAlign: 'center' }}>
                  Create or activate a pay cycle on the web app to add bills.
                </BodyText>
              </Card>
            ) : (
              <>
                {categories.map((cat) => {
                  const seeds = seedsByCategory[cat] ?? [];
                  return (
                    <View key={cat} style={{ marginBottom: spacing.xl }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: spacing.md,
                        }}>
                        <HeadlineText style={{ fontSize: 18 }}>
                          {CATEGORY_LABELS[cat]} ({seeds.length})
                        </HeadlineText>
                        {!isCycleLocked && (
                          <Pressable
                            onPress={() => openAddForm(cat)}
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: 8,
                              backgroundColor: colors.accentPrimary,
                            }}>
                            <BodyText style={{ color: '#fff', fontSize: 14 }}>+ Add {CATEGORY_SINGULAR[cat]}</BodyText>
                          </Pressable>
                        )}
                      </View>

                      {seeds.length === 0 ? (
                        <Card variant="default" padding="md">
                          <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                            No {CATEGORY_LABELS[cat].toLowerCase()} yet
                          </BodyText>
                          {!isCycleLocked && (
                            <Pressable
                              onPress={() => openAddForm(cat)}
                              style={{ alignSelf: 'center' }}>
                              <BodyText style={{ color: colors.accentPrimary }}>Add your first</BodyText>
                            </Pressable>
                          )}
                        </Card>
                      ) : (
                        seeds.map((seed) => {
                          const isJoint = !!(seed.payment_source === 'joint' && (data.household as { is_couple?: boolean })?.is_couple);
                          const canMarkUnmark = !isCycleLocked && isRitualMode;
                          return (
                            <SeedCard
                              key={seed.id}
                              seed={seed}
                              currency={currency}
                              colors={colors}
                              spacing={spacing}
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
                    </View>
                  );
                })}

                {data.pots.length > 0 && (
                  <View style={{ marginBottom: spacing.xl }}>
                    <HeadlineText style={{ fontSize: 18, marginBottom: spacing.md }}>
                      Savings pots
                    </HeadlineText>
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
                  </View>
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
    </>
  );
}
