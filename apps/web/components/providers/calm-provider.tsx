'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getCalmPreferences,
  setCalmReduceMotion as persistReduceMotion,
  setCalmCelebrations as persistCelebrations,
  type CalmPreferences,
} from '@/lib/calm-preferences';

type CalmContextValue = CalmPreferences & {
  setReduceMotion: (value: boolean) => void;
  setCelebrations: (value: boolean) => void;
};

const CalmContext = createContext<CalmContextValue | null>(null);

const DEFAULTS: CalmPreferences = { reduceMotion: false, celebrations: true };

export function CalmProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<CalmPreferences>(() => getCalmPreferences());

  const setReduceMotion = useCallback((value: boolean) => {
    persistReduceMotion(value);
    setPrefs((p) => ({ ...p, reduceMotion: value }));
  }, []);

  const setCelebrations = useCallback((value: boolean) => {
    persistCelebrations(value);
    setPrefs((p) => ({ ...p, celebrations: value }));
  }, []);

  const value = useMemo<CalmContextValue>(
    () => ({
      ...prefs,
      setReduceMotion,
      setCelebrations,
    }),
    [prefs, setReduceMotion, setCelebrations]
  );

  return <CalmContext.Provider value={value}>{children}</CalmContext.Provider>;
}

export function useCalm(): CalmContextValue {
  const ctx = useContext(CalmContext);
  if (!ctx) {
    return {
      ...DEFAULTS,
      setReduceMotion: () => {},
      setCelebrations: () => {},
    };
  }
  return ctx;
}
