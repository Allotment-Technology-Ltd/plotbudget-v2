import { ScrollView, View, RefreshControl, Pressable } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Container,
  Section,
  Card,
  HeadlineText,
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
  type SeedForMetrics,
  type PayCycleForMetrics,
} from '@repo/logic';
import type { Household, PayCycle, Seed } from '@repo/supabase';
import { fetchDashboardData } from '@/lib/dashboard-data';
import { markSeedPaid } from '@/lib/mark-seed-paid';

type StatusKey = 'good' | 'warning' | 'danger' | 'neutral';

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
      <HeadlineText
        style={{
          fontSize: 24,
          marginBottom: spacing.xs,
          color: statusColors[status],
        }}>
        {value}
      </HeadlineText>
      <BodyText color="secondary" style={{ marginBottom: spacing.md, fontSize: 14 }}>
        {subtext}
      </BodyText>
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

const TYPE_LABELS: Record<string, string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repay',
};

export default function DashboardScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const [data, setData] = useState<{
    household: Household | null;
    currentPaycycle: PayCycle | null;
    seeds: Seed[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData({
        household: result.household,
        currentPaycycle: result.currentPaycycle,
        seeds: result.seeds,
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
            <HeadlineText style={{ marginBottom: spacing.md }}>Dashboard</HeadlineText>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                Sign in to view your dashboard
              </BodyText>
              <BodyText color="secondary" style={{ textAlign: 'center' }}>
                Complete onboarding on the web app, then sign in here to see your pay cycle summary.
              </BodyText>
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
            <HeadlineText style={{ marginBottom: spacing.md }}>Dashboard</HeadlineText>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                No active pay cycle
              </BodyText>
              <BodyText color="secondary" style={{ textAlign: 'center' }}>
                Create or activate a pay cycle in Blueprint to see your dashboard.
              </BodyText>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const currency = data.household?.currency ?? 'GBP';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentPrimary} />
      }>
      <Container paddingX="md">
        <Section spacing="xl">
          <HeadlineText style={{ marginBottom: spacing.xs }}>Dashboard</HeadlineText>
          <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
            {paycycleStart} – {paycycleEnd}
          </BodyText>

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

          {(() => {
            const unpaidSeeds = data.seeds.filter(
              (s) => !s.is_paid && !optimisticPaidIds.has(s.id)
            );
            if (unpaidSeeds.length === 0) return null;
            return (
              <Card variant="default" padding="md">
                <LabelText color="secondary" style={{ marginBottom: spacing.md }}>
                  Bills to pay
                </LabelText>
                <View style={{ gap: spacing.sm }}>
                  {unpaidSeeds.slice(0, 10).map((seed) => (
                    <Pressable
                      key={seed.id}
                      onPress={() => handleMarkPaid(seed.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                      }}>
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: borderRadius.sm,
                          borderWidth: 2,
                          borderColor: colors.accentPrimary,
                          marginRight: spacing.md,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <BodyText numberOfLines={1}>{seed.name}</BodyText>
                        <LabelText color="secondary">
                          {TYPE_LABELS[seed.type] ?? seed.type} •{' '}
                          {currencySymbol(currency)}
                          {Number(seed.amount).toFixed(2)}
                        </LabelText>
                      </View>
                    </Pressable>
                  ))}
                </View>
                {unpaidSeeds.length > 10 && (
                  <LabelText
                    color="secondary"
                    style={{ marginTop: spacing.sm, fontSize: 12 }}>
                    +{unpaidSeeds.length - 10} more
                  </LabelText>
                )}
              </Card>
            );
          })()}
        </Section>
      </Container>
    </ScrollView>
  );
}
