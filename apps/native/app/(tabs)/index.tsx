import { ScrollView, View, Alert } from 'react-native';
import {
  Container,
  Section,
  Card,
  Button,
  Input,
  HeadlineText,
  BodyText,
  LabelText,
  useTheme,
} from '@repo/native-ui';
import { useState } from 'react';

export default function TabOneScreen() {
  const { colors, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Form submitted!');
    }, 2000);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <Container paddingX="md">
        <Section spacing="xl">
          <HeadlineText style={{ marginBottom: spacing.md }}>
            Component Library
          </HeadlineText>
          <BodyText color="secondary">
            PLOT Design System for React Native
          </BodyText>
        </Section>

        <Section spacing="md">
          <LabelText style={{ marginBottom: spacing.md }}>Buttons</LabelText>
          <View style={{ gap: spacing.md }}>
            <Button variant="primary" onPress={() => Alert.alert('Primary button pressed')}>
              Primary Button
            </Button>
            <Button variant="ghost" onPress={() => Alert.alert('Ghost button pressed')}>
              Ghost Button
            </Button>
            <Button variant="secondary" onPress={() => Alert.alert('Secondary button pressed')}>
              Secondary Button
            </Button>
            <Button variant="outline" onPress={() => Alert.alert('Outline button pressed')}>
              Outline Button
            </Button>
            <Button variant="primary" disabled>
              Disabled Button
            </Button>
          </View>
        </Section>

        <Section spacing="md">
          <LabelText style={{ marginBottom: spacing.md }}>Form Components</LabelText>
          <Card variant="default" padding="md">
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              helperText="We'll never share your email"
            />
            
            <View style={{ height: spacing.lg }} />
            
            <Input
              label="Password"
              placeholder="Enter password"
              secureTextEntry
              helperText="Must be at least 8 characters"
            />
            
            <View style={{ height: spacing.lg }} />
            
            <Input
              label="Disabled Input"
              placeholder="This is disabled"
              disabled
              value="Cannot edit"
            />
            
            <View style={{ height: spacing.xl }} />
            
            <Button variant="primary" onPress={handleSubmit} isLoading={isLoading}>
              Submit Form
            </Button>
          </Card>
        </Section>

        <Section spacing="md">
          <LabelText style={{ marginBottom: spacing.md }}>Cards</LabelText>
          <View style={{ gap: spacing.md }}>
            <Card variant="default" padding="md">
              <BodyText>Default Card</BodyText>
              <BodyText color="secondary" style={{ marginTop: spacing.sm }}>
                This is a default card with border
              </BodyText>
            </Card>

            <Card variant="elevated" padding="md">
              <BodyText>Elevated Card</BodyText>
              <BodyText color="secondary" style={{ marginTop: spacing.sm }}>
                This card has a shadow
              </BodyText>
            </Card>

            <Card variant="outline" padding="lg">
              <BodyText>Outline Card (Large Padding)</BodyText>
              <BodyText color="secondary" style={{ marginTop: spacing.sm }}>
                This has more padding
              </BodyText>
            </Card>
          </View>
        </Section>

        <Section spacing="2xl">
          <Card variant="elevated" padding="lg">
            <LabelText color="accent" style={{ marginBottom: spacing.sm }}>
              Design System Ready
            </LabelText>
            <BodyText>
              All components use PLOT design tokens for colors, typography, spacing, and shadows.
              Dark mode support is built-in via ThemeProvider.
            </BodyText>
          </Card>
        </Section>
      </Container>
    </ScrollView>
  );
}
