import { ScrollView, View, RefreshControl, ActivityIndicator } from 'react-native';
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
import { formatCurrency } from '@repo/logic';
import type { Pot } from '@repo/supabase';
import { fetchBlueprintData } from '@/lib/blueprint-data';

function PotCard({
  pot,
  currency,
  colors,
  spacing,
  borderRadius,
}: {
  pot: Pot;
  currency: 'GBP' | 'USD' | 'EUR';
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
}) {
  const progress =
    pot.target_amount > 0
      ? Math.min(100, (pot.current_amount / pot.target_amount) * 100)
      : 0;
  const status =
    pot.status === 'complete'
      ? 'Accomplished'
      : pot.status === 'paused'
        ? 'Paused'
        : 'Saving';

  return (
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

  const loadData = useCallback(async () => {
    const result = await fetchBlueprintData();
    setData({
      household: result.household,
      pots: result.pots,
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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bgPrimary,
        }}>
        <ActivityIndicator size="large" color={colors.accentPrimary} />
      </View>
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
              />
            ))}
          </View>
        </Section>
      </Container>
    </ScrollView>
  );
}
