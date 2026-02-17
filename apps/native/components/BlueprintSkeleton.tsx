import { View } from 'react-native';
import { Container, Section, Card, Skeleton, LabelText, useTheme } from '@repo/native-ui';

export function BlueprintSkeleton() {
  const { spacing } = useTheme();

  return (
    <View style={{ flex: 1 }} accessibilityRole="progressbar" accessibilityLabel="Loading blueprint">
      <Container paddingX="md">
        <Section spacing="xl">
          <LabelText color="secondary" style={{ marginBottom: spacing.md }}>
            Loading blueprint…
          </LabelText>
          <Skeleton width={160} height={28} style={{ marginBottom: spacing.lg }} />
          <Skeleton width={100} height={16} style={{ marginBottom: spacing.lg }} />

          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="default" padding="md" style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Skeleton width={24} height={24} />
                <Skeleton width={120} height={14} />
              </View>
              <Skeleton width="70%" height={14} style={{ marginBottom: spacing.sm }} />
              <Skeleton width="100%" height={8} borderRadius={9999} style={{ marginBottom: spacing.xs }} />
              <Skeleton width={80} height={12} />
            </Card>
          ))}
        </Section>
      </Container>
    </View>
  );
}
