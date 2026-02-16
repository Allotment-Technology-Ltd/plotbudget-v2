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
import { usePotDetailData } from '@/lib/use-pot-detail-data';
import { usePotDetailToggle } from '@/lib/use-pot-detail-toggle';
import { PotDetailCard } from '@/components/PotDetailCard';

export default function PotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { pot, currency, loading, reload, setPot } = usePotDetailData(id);
  const { toggling, handleToggleComplete } = usePotDetailToggle(pot, setPot, reload);

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

  if (!pot) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <BodyText color="secondary">Pot not found.</BodyText>
            <Pressable onPress={handleBack} style={{ marginTop: spacing.md }}>
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Go back</Text>
            </Pressable>
          </Section>
        </Container>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <Pressable onPress={handleBack} style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <FontAwesome name="chevron-left" size={16} color={colors.accentPrimary} />
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>Back</Text>
            </View>
          </Pressable>

          <PotDetailCard
            pot={pot}
            currency={currency}
            toggling={toggling}
            onToggleComplete={handleToggleComplete}
          />
        </Section>
      </Container>
    </ScrollView>
  );
}
