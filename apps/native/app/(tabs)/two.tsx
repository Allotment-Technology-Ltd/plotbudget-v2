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
import { formatCurrency } from '@repo/logic';
import type { Pot } from '@repo/supabase';
import { fetchBlueprintData } from '@/lib/blueprint-data';
import { markPotComplete } from '@/lib/mark-pot-complete';

type PotStatus = 'active' | 'complete' | 'paused';

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
  currency: 'GBP' | 'USD' | 'EUR';
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
      <Card variant="default" padding="md">
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
    household: { currency: 'GBP' | 'USD' | 'EUR' } | null;
    pots: Pot[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchBlueprintData();
      setData({
        household: result.household,
        pots: result.pots,
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

  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, PotStatus>>({});

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
                Sign in to view your savings pots
              </BodyText>
              <BodyText color="secondary" style={{ textAlign: 'center' }}>
                Complete onboarding on the web app, then sign in here to see your pots.
              </BodyText>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const currency = data.household.currency ?? 'GBP';

  if (data.pots.length === 0) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <HeadlineText style={{ marginBottom: spacing.md }}>Blueprint</HeadlineText>
            <Card variant="default" padding="lg">
              <BodyText style={{ textAlign: 'center', marginBottom: spacing.md }}>
                No savings pots yet
              </BodyText>
              <BodyText color="secondary" style={{ textAlign: 'center' }}>
                Add savings goals in the web app Blueprint to track your progress.
              </BodyText>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  return (
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
            Savings pots
          </BodyText>

          <View style={{ gap: spacing.md }}>
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
        </Section>
      </Container>
    </ScrollView>
  );
}
