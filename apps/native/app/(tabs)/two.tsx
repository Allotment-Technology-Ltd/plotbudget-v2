import { ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
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
import { markSeedPaid } from '@/lib/mark-seed-paid';
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
  onEdit,
  onDelete,
  onMarkPaid,
}: {
  seed: Seed;
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid?: () => void;
}) {
  const isPaid = !!seed.is_paid;

  return (
    <Pressable onPress={onEdit}>
      <Card variant="default" padding="md" style={{ marginBottom: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <BodyText style={{ marginBottom: spacing.xs }}>{seed.name}</BodyText>
            <LabelText color="secondary">
              {currencySymbol(currency)}
              {Number(seed.amount).toFixed(2)}
              {isPaid ? ' • Paid' : ''}
            </LabelText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {!isPaid && onMarkPaid && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onMarkPaid();
                }}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.accentPrimary,
                }}>
                <LabelText style={{ color: colors.accentPrimary, fontSize: 12 }}>Mark paid</LabelText>
              </Pressable>
            )}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, PotStatus>>({});
  const [formCategory, setFormCategory] = useState<SeedType | null>(null);
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [seedToDelete, setSeedToDelete] = useState<Seed | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchBlueprintData();
      setData({
        household: result.household,
        paycycle: result.paycycle,
        seeds: result.seeds,
        pots: result.pots,
        repayments: result.repayments,
      });
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
    async (seedId: string) => {
      setOptimisticPaidIds((prev) => new Set(prev).add(seedId));
      const result = await markSeedPaid(seedId, 'both');
      if ('success' in result) {
        await loadData();
      } else {
        setOptimisticPaidIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
      }
    },
    [loadData]
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

  const seedsByCategory = (data.seeds ?? []).reduce(
    (acc, s) => {
      const t = s.type as SeedType;
      if (!acc[t]) acc[t] = [];
      acc[t].push(s);
      return acc;
    },
    {} as Record<SeedType, Seed[]>
  );

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
                      </View>

                      {seeds.length === 0 ? (
                        <Card variant="default" padding="md">
                          <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
                            No {CATEGORY_LABELS[cat].toLowerCase()} yet
                          </BodyText>
                          <Pressable
                            onPress={() => openAddForm(cat)}
                            style={{ alignSelf: 'center' }}>
                            <BodyText style={{ color: colors.accentPrimary }}>Add your first</BodyText>
                          </Pressable>
                        </Card>
                      ) : (
                        seeds.map((seed) => (
                          <SeedCard
                            key={seed.id}
                            seed={{
                              ...seed,
                              is_paid: seed.is_paid || optimisticPaidIds.has(seed.id),
                            }}
                            currency={currency}
                            colors={colors}
                            spacing={spacing}
                            onEdit={() => openEditForm(seed)}
                            onDelete={() => setSeedToDelete(seed)}
                            onMarkPaid={
                              !seed.is_paid && !optimisticPaidIds.has(seed.id)
                                ? () => handleMarkSeedPaid(seed.id)
                                : undefined
                            }
                          />
                        ))
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
