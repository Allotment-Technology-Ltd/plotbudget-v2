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
import { markPotComplete } from '@/lib/mark-pot-complete';
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

/* ---------- Financial health score ---------- */

function calculateHealthScore(
  paycycle: PayCycle,
  household: Household,
  seeds: Seed[]
): { score: number; insights: { text: string; type: 'good' | 'warning' | 'info' }[] } {
  let score = 100;
  const insights: { text: string; type: 'good' | 'warning' | 'info' }[] = [];
  const categories = ['needs', 'wants', 'savings', 'repay'] as const;
  let overCount = 0;

  categories.forEach((cat) => {
    const target =
      paycycle.total_income * ((household[`${cat}_percent`] as number) / 100);
    const allocated =
      (paycycle[`alloc_${cat}_me`] as number) +
      (paycycle[`alloc_${cat}_partner`] as number) +
      (paycycle[`alloc_${cat}_joint`] as number);
    if (allocated > target) {
      score -= 15;
      overCount++;
    }
  });

  if (overCount > 0) {
    insights.push({ text: `Over budget in ${overCount} ${overCount === 1 ? 'category' : 'categories'}`, type: 'warning' });
  } else {
    insights.push({ text: 'On budget in all categories', type: 'good' });
  }

  const unpaid = seeds.filter((s) => !s.is_paid);
  if (unpaid.length > 0) {
    insights.push({ text: `${unpaid.length} ${unpaid.length === 1 ? 'bill' : 'bills'} unpaid`, type: 'info' });
  } else {
    score += 10;
    insights.push({ text: 'All bills paid', type: 'good' });
  }

  const savingsSeeds = seeds.filter((s) => s.type === 'savings');
  if (savingsSeeds.length > 0) {
    insights.push({ text: `${savingsSeeds.length} savings ${savingsSeeds.length === 1 ? 'goal' : 'goals'} active`, type: 'good' });
  }

  return { score: Math.max(0, Math.min(100, score)), insights };
}

function getScoreLabel(s: number, colors: import('@repo/design-tokens/native').ColorPalette) {
  if (s >= 90) return { text: 'Excellent!', color: colors.accentPrimary };
  if (s >= 75) return { text: 'Good', color: colors.accentPrimary };
  if (s >= 60) return { text: 'Fair', color: colors.warning };
  return { text: 'Needs Attention', color: colors.error };
}

function FinancialHealthSection({
  paycycle,
  household,
  seeds,
  colors,
  spacing,
  borderRadius,
}: {
  paycycle: PayCycle;
  household: Household;
  seeds: Seed[];
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
}) {
  const { score, insights } = calculateHealthScore(paycycle, household, seeds);
  const scoreLabel = getScoreLabel(score, colors);
  const barColor = score >= 75 ? colors.accentPrimary : score >= 60 ? colors.warning : colors.error;

  const insightIcon = (type: 'good' | 'warning' | 'info'): { name: React.ComponentProps<typeof FontAwesome>['name']; color: string } => {
    if (type === 'good') return { name: 'check-circle', color: colors.accentPrimary };
    if (type === 'warning') return { name: 'exclamation-circle', color: colors.warning };
    return { name: 'line-chart', color: colors.textSecondary };
  };

  return (
    <Card variant="default" padding="md">
      <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Financial Health</Text>
      <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
        <Text variant="display-sm" style={{ color: scoreLabel.color }}>{score}</Text>
        <Text variant="body-sm" color="secondary">out of 100</Text>
        <Text variant="body-sm" style={{ color: scoreLabel.color, marginTop: spacing.xs }}>{scoreLabel.text}</Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: colors.borderSubtle,
          borderRadius: borderRadius.full,
          overflow: 'hidden',
          marginBottom: spacing.md,
        }}>
        <View style={{ height: '100%', width: `${score}%`, backgroundColor: barColor, borderRadius: borderRadius.full }} />
      </View>
      <View style={{ gap: spacing.sm }}>
        {insights.map((insight, i) => {
          const icon = insightIcon(insight.type);
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <FontAwesome name={icon.name} size={14} color={icon.color} />
              <Text variant="body-sm" color="secondary">{insight.text}</Text>
            </View>
          );
        })}
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
  optimisticPotStatus,
  onMarkPotComplete,
  onPotPress,
}: {
  repayments: Repayment[];
  currency: CurrencyCode;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
  pots: Pot[];
  optimisticPotStatus: Record<string, PotStatus>;
  onMarkPotComplete: (potId: string, status: 'complete' | 'active') => void;
  onPotPress: (potId: string) => void;
}) {
  if (repayments.length === 0 && pots.length === 0) return null;

  return (
    <Card variant="default" padding="md">
      <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Savings & Debt</Text>
      <View style={{ gap: spacing.md }}>
        {pots.map((pot) => {
          const effectiveStatus = (optimisticPotStatus[pot.id] ?? pot.status) as PotStatus;
          const progress = pot.target_amount > 0 ? Math.min(100, (pot.current_amount / pot.target_amount) * 100) : 0;
          const statusLabel = effectiveStatus === 'complete' ? 'Accomplished' : effectiveStatus === 'paused' ? 'Paused' : 'Saving';
          const canToggle = effectiveStatus === 'active' || effectiveStatus === 'complete' || effectiveStatus === 'paused';
          const nextStatus = effectiveStatus === 'complete' ? 'active' : 'complete';
          return (
            <Pressable key={pot.id} onPress={() => onPotPress(pot.id)}>
              <View style={{ borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: borderRadius.md, padding: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 }}>
                      <BodyText style={{ fontSize: 18 }}>{pot.icon || '🏖️'}</BodyText>
                      <LabelText numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>{pot.name}</LabelText>
                    </View>
                    {canToggle && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          hapticImpact('light');
                          onMarkPotComplete(pot.id, nextStatus as 'complete' | 'active');
                        }}
                        hitSlop={8}
                      >
                        <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                          {effectiveStatus === 'complete' ? 'Active' : 'Done'}
                        </Text>
                      </Pressable>
                    )}
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
            <View key={rep.id} style={{ borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: borderRadius.md, padding: spacing.md }}>
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
  const [optimisticPotStatus, setOptimisticPotStatus] = useState<Record<string, PotStatus>>({});
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

  const handleMarkPotComplete = useCallback(
    async (potId: string, status: 'complete' | 'active') => {
      const pot = data?.pots.find((p) => p.id === potId);
      const prevStatus = (pot?.status ?? 'active') as PotStatus;
      setOptimisticPotStatus((s) => ({ ...s, [potId]: status }));
      const result = await markPotComplete(potId, status);
      if ('success' in result) {
        if (status === 'complete') {
          hapticSuccess();
          setShowSuccess(true);
        }
        await loadData();
        setOptimisticPotStatus((s) => {
          const next = { ...s };
          delete next[potId];
          return next;
        });
      } else {
        setOptimisticPotStatus((s) => ({ ...s, [potId]: prevStatus }));
        Alert.alert('Couldn’t update pot', result.error ?? 'Something went wrong. Try again.');
      }
    },
    [data?.pots, loadData]
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
      label: 'Left to spend',
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

          {/* Financial health */}
          <View style={{ marginTop: spacing.lg }}>
            <FinancialHealthSection
              paycycle={data.currentPaycycle}
              household={data.household}
              seeds={data.seeds}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
            />
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
                optimisticPotStatus={optimisticPotStatus}
                onMarkPotComplete={handleMarkPotComplete}
                onPotPress={(id) => {
                  hapticImpact('light');
                  router.push(`/pot-detail/${id}` as import('expo-router').Href);
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
