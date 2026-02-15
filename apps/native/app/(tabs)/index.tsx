import { ScrollView, View, RefreshControl, ActivityIndicator } from 'react-native';
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
import {
  formatCurrency,
  getDashboardCycleMetrics,
  type SeedForMetrics,
  type PayCycleForMetrics,
} from '@repo/logic';
import type { Household, PayCycle, Seed } from '@repo/supabase';
import { fetchDashboardData } from '@/lib/dashboard-data';

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

export default function DashboardScreen() {
  const { colors, spacing, borderRadius } = useTheme();
  const [data, setData] = useState<{
    household: Household | null;
    currentPaycycle: PayCycle | null;
    seeds: Seed[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const result = await fetchDashboardData();
    setData({
      household: result.household,
      currentPaycycle: result.currentPaycycle,
      seeds: result.seeds,
    });
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary }}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
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
        </Section>
      </Container>
    </ScrollView>
  );
}
