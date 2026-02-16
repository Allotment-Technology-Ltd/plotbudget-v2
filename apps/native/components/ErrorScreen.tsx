import { View } from 'react-native';
import { Container, Section, Card, HeadlineText, BodyText, Button, useTheme } from '@repo/native-ui';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  title = 'Something went wrong',
  message = 'We couldn\'t load this. Check your connection and try again.',
  onRetry,
}: ErrorScreenProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center' }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <HeadlineText style={{ marginBottom: spacing.md, textAlign: 'center' }}>
            {title}
          </HeadlineText>
          <Card variant="default" padding="lg">
            <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              {message}
            </BodyText>
            {onRetry && (
              <Button variant="primary" onPress={onRetry}>
                Try again
              </Button>
            )}
          </Card>
        </Section>
      </Container>
    </View>
  );
}
