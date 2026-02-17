import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Container,
  Section,
  Text,
  BodyText,
  useTheme,
} from '@repo/native-ui';
import { formatCurrency } from '@repo/logic';
import { useRepaymentDetailData } from '@/lib/use-repayment-detail-data';
import { RepaymentForecastSection } from '@/components/RepaymentForecastSection';

export default function RepaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const {
    repayment,
    currency,
    loading,
    reload,
    household,
    paycycle,
    linkedSeed,
  } = useRepaymentDetailData(id);

  const handleBack = () => {
    hapticImpact('light');
    router.back();
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

  if (!repayment) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <BodyText color="secondary">Repayment not found.</BodyText>
            <Pressable onPress={handleBack} style={{ marginTop: spacing.md }}>
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                Go back
              </Text>
            </Pressable>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  const paid = Number(repayment.starting_balance) - Number(repayment.current_balance);
  const progress =
    Number(repayment.starting_balance) > 0
      ? Math.min(100, (paid / Number(repayment.starting_balance)) * 100)
      : 0;
  const statusLabel =
    repayment.status === 'paid'
      ? 'Cleared'
      : repayment.status === 'paused'
        ? 'Paused'
        : 'Clearing';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <Pressable
            onPress={handleBack}
            style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <FontAwesome name="chevron-left" size={16} color={colors.accentPrimary} />
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>
                Back
              </Text>
            </View>
          </Pressable>

          <View
            style={{
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: 8,
              padding: spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <FontAwesome name="credit-card" size={20} color={colors.textSecondary} />
              <Text variant="sub">{repayment.name}</Text>
            </View>
            <BodyText color="secondary" style={{ marginBottom: spacing.sm }}>
              {formatCurrency(Number(repayment.current_balance), currency)} /{' '}
              {formatCurrency(Number(repayment.starting_balance), currency)} remaining
            </BodyText>
            <View
              style={{
                height: 8,
                backgroundColor: colors.borderSubtle,
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: spacing.xs,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: colors.warning,
                  borderRadius: 4,
                }}
              />
            </View>
            <Text variant="label-sm" color="secondary">
              {progress.toFixed(0)}% — {statusLabel}
            </Text>
          </View>

          {household && paycycle && (
            <RepaymentForecastSection
              repayment={repayment}
              household={household}
              paycycle={paycycle}
              linkedSeed={linkedSeed}
              currency={currency}
              onLockInSuccess={reload}
            />
          )}
        </Section>
      </Container>
    </ScrollView>
  );
}
