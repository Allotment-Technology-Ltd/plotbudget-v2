import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }
    Alert.alert(
      'Check your email',
      'We sent you a confirmation link. Sign in after confirming (or use sign in if you already confirmed).',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login' as import('expo-router').Href) }]
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-plot-bg-primary px-6 justify-center">
      <View className="gap-4">
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          className="rounded-lg border border-plot-border-subtle bg-plot-bg-secondary px-4 py-3 text-plot-text-primary"
          editable={!loading}
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          autoCapitalize="none"
          autoComplete="password-new"
          className="rounded-lg border border-plot-border-subtle bg-plot-bg-secondary px-4 py-3 text-plot-text-primary"
          editable={!loading}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          className="mt-2 rounded-lg bg-plot-accent-primary py-3 items-center disabled:opacity-50"
          disabled={loading}
          onPress={handleSignUp}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-plot-text-inverse font-semibold">Sign up</Text>
          )}
        </Pressable>
        <Pressable
          className="py-2 items-center"
          disabled={loading}
          onPress={() => router.back()}>
          <Text className="text-plot-accent-primary">Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
