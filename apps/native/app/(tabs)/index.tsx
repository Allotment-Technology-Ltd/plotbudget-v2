import { ScrollView, View, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ErrorScreen } from '@/components/ErrorScreen';
import {
  formatCurrency,
  getDashboardCycleMetrics,
  currencySymbol,
  type CurrencyCode,
  type SeedForMetrics,
  type PayCycleForMetrics,
} from '@repo/logic';
import type { Household, PayCycle, Seed, Pot, Repayment } from '@repo/supabase';
import { fetchDashboardData } from '@/lib/dashboard-data';
import { markSeedPaid } from '@/lib/mark-seed-paid';
import { SeedFormModal } from '@/components/SeedFormModal';
import { SuccessAnimation } from '@/components/SuccessAnimation';
import { hapticImpact, hapticSuccess } from '@/lib/haptics';

type StatusKey = 'good' | 'warning' | 'danger' | 'neutral';
type PotStatus = 'active' | 'complete' | 'paused';

/* ---------- Hero metric card ---------- */

function MetricCard({
  label,
  value,
  subtext,
  percentage,
  status,
  colors,
  spacing,
  borderRadius,
}: {
  label: string;
  value: string;
  subtext: string;
  percentage: number;
  status: StatusKey;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
}) {
  const statusColors: Record<StatusKey, string> = {
    good: colors.accentPrimary,
    warning: colors.warning,
    danger: colors.error,
    neutral: colors.textPrimary,
  };
  const barColor =
    status === 'danger' ? colors.error : status === 'warning' ? colors.warning : colors.accentPrimary;

  return (
    <Card variant="default" padding="md">
      <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>
        {label}
      </LabelText>
      <SubheadingText
        style={{
          marginBottom: spacing.xs,
          color: statusColors[status],
        }}>
        {value}
      </SubheadingText>
      <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.md }}>
        {subtext}
      </Text>
      <View
        style={{
          height: 8,
          backgroundColor: colors.borderSubtle,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
        }}>
        <View
          style={{
            height: '100%',
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: barColor,
            borderRadius: borderRadius.full,
          }}
        />
      </View>
    </Card>
  );
}

/* ---------- Savings & debt progress ---------- */

function SavingsDebtSection({
  repayments,
  currency,
  colors,
  spacing,
  borderRadius,
  pots,
  onPotPress,
  onRepaymentPress,
}: {
  repayments: Repayment[];
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
  pots: Pot[];
  onPotPress: (potId: string) => void;
  onRepaymentPress: (repaymentId: string) => void;
}) {
  if (repayments.length === 0 && pots.length === 0) return null;

  return (
    <Card variant="default" padding="md">
      <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Savings & Debt</Text>
      <View style={{ gap: spacing.md }}>
        {pots.map((pot) => {
          const potStatus = (pot.status ?? 'active') as PotStatus;
          const progress = pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
          const statusLabel = potStatus === 'complete' ? 'Accomplished' : potStatus === 'paused' ? 'Paused' : 'Saving';
          return (
            <Pressable key={pot.id} onPress={() => onPotPress(pot.id)}>
              <View style={{ borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: borderRadius.md, padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                    <BodyText style={{ fontSize: 18 }}>{pot.icon || '🏖️'}</BodyText>
                    <LabelText numberOfLines={1} style={{ flex: 1, minWidth: 0, marginLeft: spacing.sm }}>{pot.name}</LabelText>
                  </View>
                  <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
                    {currencySymbol(currency)}{pot.current_amount.toFixed(2)} / {currencySymbol(currency)}{pot.target_amount.toFixed(2)}
                  </Text>
                  <View style={{ height: 8, backgroundColor: colors.borderSubtle, borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.xs }}>
                    <View style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.savings, borderRadius: borderRadius.full }} />
                  </View>
                  <Text variant="label-sm" color="secondary">{progress.toFixed(0)}% — {statusLabel}</Text>
                </View>
            </Pressable>
          );
        })}
        {repayments.map((rep) => {
          const paid = rep.starting_balance - rep.current_balance;
          const progress = rep.starting_balance > 0 ? Math.min(100, (paid / rep.starting_balance) * 100) : 0;
          const statusLabel = rep.status === 'paid' ? 'Cleared' : rep.status === 'paused' ? 'Paused' : 'Clearing';
          return (
            <Pressable key={rep.id} onPress={() => onRepaymentPress(rep.id)}>
              <View style={{ borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: borderRadius.md, padding: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <FontAwesome name="credit-card" size={14} color={colors.textSecondary} />
                  <LabelText numberOfLines={1}>{rep.name}</LabelText>
                </View>
                <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
                  {currencySymbol(currency)}{rep.current_balance.toFixed(2)} / {currencySymbol(currency)}{rep.starting_balance.toFixed(2)}
                </Text>
                <View style={{ height: 8, backgroundColor: colors.borderSubtle, borderRadius: borderRadius.full, overflow: 'hidden', marginBottom: spacing.xs }}>
                  <View style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.warning, borderRadius: borderRadius.full }} />
                </View>
                <Text variant="label-sm" color="secondary">{progress.toFixed(0)}% — {statusLabel}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

/* ---------- Category breakdown ---------- */

function CategoryBreakdownSection({
  paycycle,
  household,
  currency,
  colors,
  spacing,
  borderRadius,
  onCategoryPress,
}: {
  paycycle: PayCycle;
  household: Household;
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
  onCategoryPress: (type: 'needs' | 'wants' | 'savings' | 'repay') => void;
}) {
  const totalIncome = Number(paycycle.total_income);
  const categories = [
    { key: 'needs' as const, label: 'Needs' },
    { key: 'wants' as const, label: 'Wants' },
    { key: 'savings' as const, label: 'Savings' },
    { key: 'repay' as const, label: 'Repay' },
  ];

  return (
    <View>
      <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Category Breakdown</Text>
      <View style={{ gap: spacing.md }}>
        {categories.map((cat) => {
          const percent = (household[`${cat.key}_percent`] as number) ?? 0;
          const target = totalIncome * (percent / 100);
          const allocated =
            Number(paycycle[`alloc_${cat.key}_me`] ?? 0) +
            Number(paycycle[`alloc_${cat.key}_partner`] ?? 0) +
            Number(paycycle[`alloc_${cat.key}_joint`] ?? 0);
          const progress = target > 0 ? Math.min((allocated / target) * 100, 100) : 0;
          const isOver = target > 0 && allocated > target;
          return (
            <Pressable key={cat.key} onPress={() => onCategoryPress(cat.key)}>
              <Card variant="default" padding="md">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                    <LabelText>{cat.label}</LabelText>
                    <Text variant="body-sm" color="secondary">
                      {formatCurrency(allocated, currency)} / {formatCurrency(target, currency)}
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: colors.borderSubtle, borderRadius: borderRadius.full, overflow: 'hidden' }}>
                    <View
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: isOver ? colors.warning : colors.accentPrimary,
                        borderRadius: borderRadius.full,
                      }}
                    />
                  </View>
                  {isOver && (
                    <Text variant="label-sm" style={{ color: colors.warning, marginTop: 2 }}>Over budget</Text>
                  )}
                </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Upcoming bills ---------- */

const TYPE_LABELS: Record<string, string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repay',
};

function UpcomingBillsSection({
  seeds,
  currency,
  optimisticPaidIds,
  onMarkPaid,
  onEdit,
  colors,
  spacing,
  borderRadius,
}: {
  seeds: Seed[];
  currency: CurrencyCode;
  optimisticPaidIds: Set<string>;
  onMarkPaid: (seedId: string) => void;
  onEdit: (seed: Seed) => void;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
}) {
  const unpaidSeeds = seeds.filter((s) => !s.is_paid && !optimisticPaidIds.has(s.id));

  return (
    <Card variant="default" padding="md">
      <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Upcoming Bills</Text>
      {unpaidSeeds.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <FontAwesome name="check-circle" size={40} color={colors.accentPrimary} style={{ marginBottom: spacing.sm }} />
          <Text variant="body-sm" color="secondary">All bills paid. Great job!</Text>
        </View>
      ) : (
        <>
          <View style={{ gap: spacing.xs }}>
            {unpaidSeeds.slice(0, 7).map((seed, idx) => (
              <Pressable
                key={seed.id}
                onPress={() => {
                  hapticImpact('light');
                  onMarkPaid(seed.id);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: idx < Math.min(unpaidSeeds.length, 7) - 1 ? 1 : 0,
                  borderBottomColor: colors.borderSubtle,
                }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: borderRadius.sm,
                    borderWidth: 2,
                    borderColor: colors.accentPrimary,
                    marginRight: spacing.md,
                  }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <BodyText numberOfLines={1}>{seed.name}</BodyText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: spacing.sm }}>
                  <Text variant="label-sm" color="secondary">{TYPE_LABELS[seed.type] ?? seed.type}</Text>
                  <Text variant="body-sm">{currencySymbol(currency)}{Number(seed.amount).toFixed(2)}</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      hapticImpact('light');
                      onEdit(seed);
                    }}
                    hitSlop={8}
                    style={{ padding: spacing.xs }}>
                    <FontAwesome name="pencil" size={14} color={colors.accentPrimary} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
          {unpaidSeeds.length > 7 && (
            <Text variant="label-sm" color="secondary" style={{ marginTop: spacing.sm }}>
              +{unpaidSeeds.length - 7} more unpaid
            </Text>
          )}
        </>
      )}
    </Card>
  );
}

/* ---------- Dashboard screen ---------- */

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [data, setData] = useState<{
    household: Household | null;
    currentPaycycle: PayCycle | null;
    seeds: Seed[];
    pots: Pot[];
    repayments: Repayment[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());
  const [editingSeed, setEditingSeed] = useState<Seed | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData({
        household: result.household,
        currentPaycycle: result.currentPaycycle,
        seeds: result.seeds,
        pots: result.pots,
        repayments: result.repayments,
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load dashboard'));
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

  const handleMarkPaid = useCallback(
    async (seedId: string) => {
      setOptimisticPaidIds((prev) => new Set(prev).add(seedId));
      const result = await markSeedPaid(seedId, 'both');
      if ('success' in result) {
        hapticSuccess();
        setShowSuccess(true);
        await loadData();
      } else {
        setOptimisticPaidIds((prev) => {
          const next = new Set(prev);
          next.delete(seedId);
          return next;
        });
        Alert.alert('Couldn’t mark as paid', result.error ?? 'Something went wrong. Try again.');
      }
    },
    [loadData]
  );

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Couldn't load dashboard"
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
            <Text variant="headline-sm" style={{ marginBottom: spacing.sm }}>Dashboard</Text>
            <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.lg }}>Your financial overview</Text>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                Sign in to view your dashboard
              </BodyText>
              <Text variant="body-sm" color="secondary" style={{ textAlign: 'center' }}>
                Complete onboarding on the web app, then sign in here to see your pay cycle summary.
              </Text>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  if (!data.currentPaycycle) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <Text variant="headline-sm" style={{ marginBottom: spacing.sm }}>Dashboard</Text>
            <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.lg }}>Your financial overview</Text>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                No active pay cycle
              </BodyText>
              <Text variant="body-sm" color="secondary" style={{ textAlign: 'center' }}>
                Create or activate a pay cycle in Blueprint to see your dashboard.
              </Text>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const currency: CurrencyCode = data.household?.currency ?? 'GBP';
  const metrics = getDashboardCycleMetrics(
    data.currentPaycycle as PayCycleForMetrics,
    data.seeds as SeedForMetrics[]
  );
  const {
    totalRemaining,
    allocatedPercent,
    remainingPercent,
    daysRemaining,
    cycleNotStarted,
    daysUntilStart,
    cycleProgress,
  } = metrics;

  const paycycleStart = format(new Date(data.currentPaycycle.start_date), 'MMM d');
  const paycycleEnd = format(new Date(data.currentPaycycle.end_date), 'MMM d, yyyy');
  const startDate = new Date(data.currentPaycycle.start_date);

  const metricCards = [
    {
      label: 'Allocated',
      value: formatCurrency(data.currentPaycycle.total_allocated, currency),
      subtext: `of ${formatCurrency(data.currentPaycycle.total_income, currency)}`,
      percentage: allocatedPercent,
      status: (allocatedPercent > 100 ? 'danger' : allocatedPercent > 90 ? 'warning' : 'good') as StatusKey,
    },
    {
      label: 'Left to pay',
      value: formatCurrency(totalRemaining, currency),
      subtext: `${remainingPercent.toFixed(0)}% of income left this cycle`,
      percentage: remainingPercent,
      status: (remainingPercent < 10 ? 'warning' : 'good') as StatusKey,
    },
    {
      label: 'Days Left',
      value: cycleNotStarted ? `Starts in ${daysUntilStart} days` : `${daysRemaining} days`,
      subtext: cycleNotStarted
        ? `Pay day: ${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : `${cycleProgress.toFixed(0)}% through`,
      percentage: cycleProgress,
      status: 'neutral' as StatusKey,
    },
  ];

  return (
    <>
      <SuccessAnimation
        visible={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />
      }>
      <Container paddingX="md">
        <Section spacing="xl">
          {/* Header */}
          <Text variant="headline-sm" style={{ marginBottom: spacing.xs }}>Dashboard</Text>
          <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.lg }}>
            Your financial overview  ·  {paycycleStart} – {paycycleEnd}
          </Text>

          {/* Hero metrics */}
          <View style={{ gap: spacing.md }}>
            {metricCards.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                subtext={metric.subtext}
                percentage={metric.percentage}
                status={metric.status}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
              />
            ))}
          </View>

          {/* Category breakdown */}
          <View style={{ marginTop: spacing.lg }}>
            <CategoryBreakdownSection
              paycycle={data.currentPaycycle}
              household={data.household}
              currency={currency}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
              onCategoryPress={(type) => {
                hapticImpact('light');
                router.push(`/budget-detail/${type}` as import('expo-router').Href);
              }}
            />
          </View>

          {/* Upcoming bills */}
          <View style={{ marginTop: spacing.lg }}>
            <UpcomingBillsSection
              seeds={data.seeds}
              currency={currency}
              optimisticPaidIds={optimisticPaidIds}
              onMarkPaid={handleMarkPaid}
              onEdit={(seed) => setEditingSeed(seed)}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
          </View>

          {/* Savings & debt (repayments only; pots are managed via Blueprint savings seeds) */}
          {data.repayments.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <SavingsDebtSection
                repayments={data.repayments}
                currency={currency}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
                pots={data.pots}
                onPotPress={(id) => {
                  hapticImpact('light');
                  router.push(`/pot-detail/${id}` as import('expo-router').Href);
                }}
                onRepaymentPress={(id) => {
                  hapticImpact('light');
                  router.push(`/repayment-detail/${id}` as import('expo-router').Href);
                }}
              />
            </View>
          )}
        </Section>
      </Container>

      {editingSeed && data.household && data.currentPaycycle && (
        <SeedFormModal
          visible={!!editingSeed}
          onClose={() => setEditingSeed(null)}
          onSuccess={() => {
            loadData();
            setEditingSeed(null);
          }}
          category={editingSeed.type as 'need' | 'want' | 'savings' | 'repay'}
          seed={editingSeed}
          household={data.household}
          paycycle={data.currentPaycycle}
          pots={data.pots}
          repayments={data.repayments}
        />
      )}
    </ScrollView>
    </>
  );
}
