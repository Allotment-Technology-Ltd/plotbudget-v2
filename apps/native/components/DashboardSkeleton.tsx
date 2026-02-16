import { View } from 'react-native';
import { Container, Section, Card, Skeleton, useTheme } from '@repo/native-ui';

export function DashboardSkeleton() {
  const { spacing } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <Skeleton width={180} height={28} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={140} height={16} style={{ marginBottom: spacing.lg }} />

          {[1, 2, 3].map((i) => (
            <Card key={i} variant="default" padding="md" style={{ marginBottom: spacing.md }}>
              <Skeleton width={80} height={12} style={{ marginBottom: spacing.sm }} />
              <Skeleton width={120} height={24} style={{ marginBottom: spacing.xs }} />
              <Skeleton width="90%" height={14} style={{ marginBottom: spacing.md }} />
              <Skeleton width="100%" height={8} borderRadius={9999} />
            </Card>
          ))}
        </Section>
      </Container>
    </View>
  );
}
