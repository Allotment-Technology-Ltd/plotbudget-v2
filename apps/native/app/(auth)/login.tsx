import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    const { error: signInError } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        setError('Email or password is incorrect');
      } else {
        setError(signInError.message);
      }
      return;
    }
    router.replace('/(tabs)');
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
              Welcome Back
            </HeadlineText>
            <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Sign in to your PLOT account
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <LabelText>Password</LabelText>
                <Text
                  style={{ color: colors.accentPrimary, fontSize: 14, fontWeight: '500' }}
                  onPress={() => router.push('/(auth)/forgot-password' as import('expo-router').Href)}>
                  Forgot password?
                </Text>
              </View>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                placeholder="••••••••"
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
              onPress={() => void handleSignIn()}
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
                  Sign In
                </Text>
              )}
            </Pressable>

            <BodyText color="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
              Don&apos;t have an account?{' '}
              <Text
                style={{ color: colors.accentPrimary, fontWeight: '500' }}
                onPress={() => router.push('/(auth)/sign-up' as import('expo-router').Href)}>
                Sign up
              </Text>
            </BodyText>
          </Card>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
