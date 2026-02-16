/**
 * Granular push notification preferences. When all are disabled we do not register
 * the token and we remove existing tokens from the backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@plot/push-preferences';

export type PushPreferenceFlags = {
  paydayReminders: boolean;
  partnerActivity: boolean;
  billsMarkedPaid: boolean;
};

const DEFAULT_PREFS: PushPreferenceFlags = {
  paydayReminders: true,
  partnerActivity: true,
  billsMarkedPaid: true,
};

type PushPreferencesContextValue = {
  /** At least one category enabled; when true we register the token. */
  pushEnabled: boolean;
  paydayReminders: boolean;
  partnerActivity: boolean;
  billsMarkedPaid: boolean;
  setPaydayReminders: (value: boolean) => void;
  setPartnerActivity: (value: boolean) => void;
  setBillsMarkedPaid: (value: boolean) => void;
  /** Current flags for sending to API (register or PATCH preferences). */
  preferences: PushPreferenceFlags;
  hydrated: boolean;
};

const PushPreferencesContext = createContext<PushPreferencesContextValue | null>(null);

function prefsToPushEnabled(p: PushPreferenceFlags): boolean {
  return p.paydayReminders || p.partnerActivity || p.billsMarkedPaid;
}

export function PushPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<PushPreferenceFlags>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<PushPreferenceFlags>;
          setPreferencesState({
            paydayReminders: parsed.paydayReminders ?? true,
            partnerActivity: parsed.partnerActivity ?? true,
            billsMarkedPaid: parsed.billsMarkedPaid ?? true,
          });
        } catch {
          // keep defaults
        }
      }
      setHydrated(true);
    });
  }, []);

  const persist = useCallback((next: PushPreferenceFlags) => {
    setPreferencesState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) => {
      if (__DEV__) console.warn('[PushPreferences] persist failed:', err);
    });
  }, []);

  const setPaydayReminders = useCallback(
    (value: boolean) => {
      const next = { ...preferences, paydayReminders: value };
      persist(next);
    },
    [preferences, persist]
  );

  const setPartnerActivity = useCallback(
    (value: boolean) => {
      const next = { ...preferences, partnerActivity: value };
      persist(next);
    },
    [preferences, persist]
  );

  const setBillsMarkedPaid = useCallback(
    (value: boolean) => {
      const next = { ...preferences, billsMarkedPaid: value };
      persist(next);
    },
    [preferences, persist]
  );

  const value: PushPreferencesContextValue = {
    pushEnabled: hydrated ? prefsToPushEnabled(preferences) : true,
    paydayReminders: hydrated ? preferences.paydayReminders : true,
    partnerActivity: hydrated ? preferences.partnerActivity : true,
    billsMarkedPaid: hydrated ? preferences.billsMarkedPaid : true,
    setPaydayReminders,
    setPartnerActivity,
    setBillsMarkedPaid,
    preferences,
    hydrated,
  };

  return (
    <PushPreferencesContext.Provider value={value}>
      {children}
    </PushPreferencesContext.Provider>
  );
}

export function usePushPreferences() {
  const ctx = useContext(PushPreferencesContext);
  if (!ctx) throw new Error('usePushPreferences must be used within PushPreferencesProvider');
  return ctx;
}
