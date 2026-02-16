/**
 * Optional "Unlock app with biometrics" (fingerprint/face).
 * When enabled, app shows a lock screen until biometric auth succeeds.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const STORAGE_KEY = '@plot/biometric-enabled';

type BiometricContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  unlocked: boolean;
  authenticate: () => Promise<boolean>;
  biometricAvailable: boolean;
  hydrated: boolean;
};

const BiometricContext = createContext<BiometricContextValue | null>(null);

export function BiometricProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    LocalAuthentication.getEnrolledLevelAsync().then((level) => {
      const available = level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG || level === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK;
      setBiometricAvailable(available);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const value = stored === 'true';
      setEnabledState(value);
      setUnlocked(!value);
      setHydrated(true);
    });
  }, []);

  // If user enabled biometric but device has none, keep app unlocked
  useEffect(() => {
    if (hydrated && enabled && !biometricAvailable) {
      setUnlocked(true);
    }
  }, [hydrated, enabled, biometricAvailable]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (value) {
      setUnlocked(false);
    } else {
      setUnlocked(true);
    }
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch((err) => {
      if (__DEV__) console.warn('[BiometricContext] persist failed:', err);
    });
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Plot Budget',
      fallbackLabel: 'Use passcode',
    });
    if (result.success) {
      setUnlocked(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const value: BiometricContextValue = {
    enabled,
    setEnabled,
    unlocked,
    authenticate,
    biometricAvailable,
    hydrated,
  };

  return <BiometricContext.Provider value={value}>{children}</BiometricContext.Provider>;
}

export function useBiometric() {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric must be used within BiometricProvider');
  return ctx;
}

/** Safe version for use in screens that may mount before provider is ready. Returns null when outside provider. */
export function useBiometricOptional(): BiometricContextValue | null {
  return useContext(BiometricContext);
}
