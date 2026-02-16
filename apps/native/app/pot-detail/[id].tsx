import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Pressable, Alert } from 'react-native';
import { hapticImpact, hapticSuccess } from '@/lib/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Container,
  Section,
  Card,
  Text,
  SubheadingText,
  BodyText,
  useTheme,
} from '@repo/native-ui';
import { currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Pot } from '@repo/supabase';
import { fetchDashboardData } from '@/lib/dashboard-data';
import { markPotComplete } from '@/lib/mark-pot-complete';

export default function PotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [pot, setPot] = useState<Pot | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      const found = result.pots.find((p) => p.id === id);
      setPot(found ?? null);
      setCurrency((result.household?.currency ?? 'GBP') as CurrencyCode);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleComplete = async () => {
    if (!pot || toggling) return;
    const nextStatus = pot.status === 'complete' ? 'active' : 'complete';
    setToggling(true);
    const result = await markPotComplete(pot.id, nextStatus);
    setToggling(false);
    if ('success' in result) {
      hapticSuccess();
      setPot((p) => (p ? { ...p, status: nextStatus } : null));
    } else {
      Alert.alert('Couldn’t update pot', result.error ?? 'Try again.');
    }
  };

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <View style={{ paddingVertical: spacing.xl }}>
              <BodyText color="secondary">Loading…</BodyText>
            </View>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  if (!pot) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <BodyText color="secondary">Pot not found.</BodyText>
            <Pressable onPress={() => { hapticImpact('light'); router.back(); }} style={{ marginTop: spacing.md }}>
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Go back</Text>
            </Pressable>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const target = Number(pot.target_amount);
  const current = Number(pot.current_amount);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const statusLabel = pot.status === 'complete' ? 'Accomplished' : pot.status === 'paused' ? 'Paused' : 'Saving';
  const canToggle = pot.status === 'active' || pot.status === 'complete' || pot.status === 'paused';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <Pressable onPress={() => { hapticImpact('light'); router.back(); }} style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <FontAwesome name="chevron-left" size={16} color={colors.accentPrimary} />
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Back</Text>
            </View>
          </Pressable>

          <Card variant="default" padding="lg" style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                <BodyText style={{ fontSize: 28 }}>{pot.icon || '🏖️'}</BodyText>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <SubheadingText>{pot.name}</SubheadingText>
                  <Text variant="label-sm" color="secondary">{statusLabel}</Text>
                </View>
              </View>
              <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.sm }}>
                {currencySymbol(currency)}{current.toFixed(2)} / {currencySymbol(currency)}{target.toFixed(2)}
              </Text>
              <View
                style={{
                  height: 10,
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
              <Text variant="label-sm" color="secondary">{progress.toFixed(0)}%</Text>
              {canToggle && (
                <Pressable
                  onPress={() => {
                    hapticImpact('light');
                    handleToggleComplete();
                  }}
                  disabled={toggling}
                  style={{
                    marginTop: spacing.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.accentPrimary,
                    alignSelf: 'flex-start',
                  }}>
                  <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                    {toggling ? 'Updating…' : pot.status === 'complete' ? 'Mark as active' : 'Mark accomplished'}
                  </Text>
                </Pressable>
              )}
            </Card>
        </Section>
      </Container>
    </ScrollView>
  );
}
