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
import { supabase } from '@/lib/supabase';

const WEB_APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? '';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your email address');
      return;
    }
    if (!WEB_APP_URL) {
      setError('App is misconfigured. Please contact support.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${WEB_APP_URL.replace(/\/$/, '')}/auth/callback`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
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
                Check your email
              </HeadlineText>
              <BodyText
                color="secondary"
                style={{ textAlign: 'center', marginBottom: spacing.lg }}>
                If we have an account with that email, we&apos;ve sent a link to reset your password.
                Check your inbox and spam folder.
              </BodyText>
              <BodyText
                color="secondary"
                style={{ textAlign: 'center', marginBottom: spacing.lg, fontSize: 14 }}>
                Open the link on this device or another to set a new password, then sign in here with
                your new password.
              </BodyText>
              <Pressable
                onPress={() => router.replace('/(auth)/login' as import('expo-router').Href)}
                style={{
                  backgroundColor: colors.accentPrimary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  Back to sign in
                </Text>
              </Pressable>
            </Card>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
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
              Reset password
            </HeadlineText>
            <BodyText color="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Enter your email and we&apos;ll send a link to reset your password.
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
              onPress={() => void handleSubmit()}
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
                  Send reset link
                </Text>
              )}
            </Pressable>

            <BodyText color="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
              Remember your password?{' '}
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
