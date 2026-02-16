import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
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
import { formatCurrency, currencySymbol, type CurrencyCode } from '@repo/logic';
import type { Household, PayCycle, Seed } from '@repo/supabase';
import { fetchDashboardData } from '@/lib/dashboard-data';

type CategoryType = 'needs' | 'wants' | 'savings' | 'repay';

const CATEGORY_LABELS: Record<CategoryType, string> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings',
  repay: 'Repay',
};

export default function BudgetDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [data, setData] = useState<{
    household: Household | null;
    currentPaycycle: PayCycle | null;
    seeds: Seed[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const categoryType = (type ?? 'needs') as CategoryType;
  const validType = ['needs', 'wants', 'savings', 'repay'].includes(categoryType)
    ? categoryType
    : 'needs';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      setData({
        household: result.household,
        currentPaycycle: result.currentPaycycle,
        seeds: result.seeds,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !data?.household || !data.currentPaycycle) {
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

  const paycycle = data.currentPaycycle;
  const household = data.household;
  const currency = (household.currency ?? 'GBP') as CurrencyCode;
  const totalIncome = Number(paycycle.total_income);
  const percent = (household[`${validType}_percent`] as number) ?? 0;
  const target = totalIncome * (percent / 100);
  const allocated =
    Number(paycycle[`alloc_${validType}_me`] ?? 0) +
    Number(paycycle[`alloc_${validType}_partner`] ?? 0) +
    Number(paycycle[`alloc_${validType}_joint`] ?? 0);
  const remaining =
    Number(paycycle[`rem_${validType}_me`] ?? 0) +
    Number(paycycle[`rem_${validType}_partner`] ?? 0) +
    Number(paycycle[`rem_${validType}_joint`] ?? 0);
  const progress = target > 0 ? Math.min((allocated / target) * 100, 100) : 0;
  const isOver = target > 0 && allocated > target;
  const categoryToSeedType: Record<CategoryType, 'need' | 'want' | 'savings' | 'repay'> = {
    needs: 'need',
    wants: 'want',
    savings: 'savings',
    repay: 'repay',
  };
  const categorySeeds = data.seeds.filter((s) => s.type === categoryToSeedType[validType]);
  const paidCount = categorySeeds.filter((s) => s.is_paid).length;

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
              <LabelText color="secondary" style={{ marginBottom: spacing.sm }}>
                {CATEGORY_LABELS[validType]}
              </LabelText>
              <SubheadingText style={{ marginBottom: spacing.xs }}>
                {formatCurrency(allocated, currency)} allocated
              </SubheadingText>
              <Text variant="body-sm" color="secondary" style={{ marginBottom: spacing.md }}>
                of {formatCurrency(target, currency)} target ({percent}%)
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
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: isOver ? colors.warning : colors.accentPrimary,
                    borderRadius: borderRadius.full,
                  }}
                />
              </View>
              {isOver && (
                <Text variant="label-sm" style={{ color: colors.warning, marginTop: 2 }}>Over budget</Text>
              )}
              <Text variant="label-sm" color="secondary" style={{ marginTop: spacing.sm }}>
                {formatCurrency(remaining, currency)} remaining
              </Text>
            </Card>

          <Card variant="default" padding="md">
            <Text variant="sub-sm" style={{ marginBottom: spacing.md }}>Bills in this category</Text>
            {categorySeeds.length === 0 ? (
              <BodyText color="secondary">No bills in this category yet.</BodyText>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {categorySeeds.map((seed) => (
                  <View
                    key={seed.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.borderSubtle,
                    }}>
                    <BodyText>{seed.name}</BodyText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="body-sm" color="secondary">
                        {currencySymbol(currency)}{Number(seed.amount).toFixed(2)}
                      </Text>
                      {seed.is_paid ? (
                        <View style={{ paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.accentPrimary + '20' }}>
                          <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Paid</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
            {categorySeeds.length > 0 && (
              <Text variant="label-sm" color="secondary" style={{ marginTop: spacing.sm }}>
                {paidCount} of {categorySeeds.length} paid
              </Text>
            )}
          </Card>
        </Section>
      </Container>
    </ScrollView>
  );
}
