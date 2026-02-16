/**
 * Full-screen overlay when biometric is enabled and app is locked.
 * User must authenticate to continue.
 */

import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { BodyText, Button, HeadlineText, useTheme } from '@repo/native-ui';
import { useBiometric } from '@/contexts/BiometricContext';

export function BiometricLockScreen() {
  const { enabled, unlocked, authenticate, biometricAvailable, hydrated } = useBiometric();
  const { colors, spacing } = useTheme();
  const [error, setError] = useState<string | null>(null);

  const tryAuth = useCallback(async () => {
    setError(null);
    const ok = await authenticate();
    if (!ok) setError('Authentication failed. Try again.');
  }, [authenticate]);

  useEffect(() => {
    if (hydrated && enabled && !unlocked) {
      tryAuth();
    }
  }, [hydrated, enabled, unlocked, tryAuth]);

  if (!hydrated || !enabled || unlocked) return null;
  if (!biometricAvailable) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.bgPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: spacing.xl,
      }}>
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <FontAwesome name="lock" size={48} color={colors.textSecondary} style={{ marginBottom: spacing.md }} />
        <HeadlineText fontFamily="heading" style={{ color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' }}>
          App locked
        </HeadlineText>
        <BodyText color="secondary" style={{ textAlign: 'center' }}>
          Use your fingerprint or face to unlock
        </BodyText>
      </View>
      {error ? (
        <BodyText style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}>{error}</BodyText>
      ) : null}
      <Button variant="primary" size="md" onPress={tryAuth}>
        Unlock
      </Button>
    </View>
  );
}
