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

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    router.replace('/(tabs)');
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
          autoComplete="password"
          className="rounded-lg border border-plot-border-subtle bg-plot-bg-secondary px-4 py-3 text-plot-text-primary"
          editable={!loading}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          className="mt-2 rounded-lg bg-plot-accent-primary py-3 items-center disabled:opacity-50"
          disabled={loading}
          onPress={handleSignIn}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-plot-text-inverse font-semibold">Sign in</Text>
          )}
        </Pressable>
        <Pressable
          className="py-2 items-center"
          disabled={loading}
          onPress={() => router.push('/(auth)/sign-up' as import('expo-router').Href)}>
          <Text className="text-plot-accent-primary">Create an account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
