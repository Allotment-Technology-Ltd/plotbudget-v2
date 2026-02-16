import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Card,
  Container,
  HeadlineText,
  BodyText,
  LabelText,
  useTheme,
} from '@repo/native-ui';
import { useAuth } from '@/contexts/AuthContext';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_REGEX = /^[a-zA-Z0-9-_]+$/;

function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'Password must be at least 12 characters';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password can only contain letters, numbers, hyphens, and underscores';
  }
  return null;
}

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await signUp(email.trim().toLowerCase(), password);
    setLoading(false);
    if (signUpError) {
      if (signUpError.message.includes('User already registered')) {
        setError('An account with this email already exists');
      } else {
        setError(signUpError.message);
      }
      return;
    }
    Alert.alert(
      'Account created',
      'Check your email for a confirmation link. Sign in after confirming (or use sign in if you already confirmed).',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login' as import('expo-router').Href) }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: spacing.lg }}
        keyboardShouldPersistTaps="handled">
        <Container paddingX="md">
          <Card variant="default" padding="lg">
            <HeadlineText
              style={{
                textAlign: 'center',
                marginBottom: spacing.xs,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}>
              Create Account
            </HeadlineText>
            <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Sign up to start plotting your budget together
            </BodyText>

            <View style={{ marginBottom: spacing.md }}>
              <LabelText style={{ marginBottom: spacing.xs }}>Email</LabelText>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={(t) => setEmail(t)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  fontSize: 16,
                }}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <LabelText style={{ marginBottom: spacing.xs }}>Password</LabelText>
              <TextInput
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
                placeholder="e.g. coffee-piano-sunset"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  fontSize: 16,
                }}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <LabelText style={{ marginBottom: spacing.xs }}>Confirm Password</LabelText>
              <TextInput
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!loading}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  fontSize: 16,
                }}
              />
            </View>

            {error && (
              <View
                style={{
                  backgroundColor: colors.error + '1A',
                  borderWidth: 1,
                  borderColor: colors.error + '4D',
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                }}>
                <BodyText style={{ color: colors.error, fontSize: 14 }}>{error}</BodyText>
              </View>
            )}

            <Pressable
              onPress={() => void handleSignUp()}
              disabled={loading}
              style={{
                backgroundColor: colors.accentPrimary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                alignItems: 'center',
                marginBottom: spacing.lg,
                opacity: loading ? 0.7 : 1,
              }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <BodyText color="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
              Already have an account?{' '}
              <Text
                style={{ color: colors.accentPrimary, fontWeight: '500' }}
                onPress={() => router.back()}>
                Sign in
              </Text>
            </BodyText>
          </Card>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
