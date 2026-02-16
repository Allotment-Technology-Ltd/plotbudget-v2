import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Platform } from 'react-native';

const QUERY_CACHE_KEY = 'plotbudget-query-cache';
const STALE_TIME_MS = 1000 * 60 * 5; // 5 minutes
const GC_TIME_MS = 1000 * 60 * 60 * 24; // 24 hours (match persist maxAge)
const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * MMKV storage for query cache. Returns null on web or when MMKV is unavailable
 * (e.g. Expo Go; MMKV requires a development build). When null, persistence is a no-op.
 */
function createMmkvStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic for Expo Go fallback when native MMKV unavailable
    const { MMKV } = require('react-native-mmkv');
    const mmkv = new MMKV({ id: 'plotbudget-query-cache' });
    return {
      getItem: (k: string) => mmkv.getString(k) ?? null,
      setItem: (k: string, v: string) => mmkv.set(k, v),
      removeItem: (k: string) => mmkv.delete(k),
    };
  } catch {
    return null;
  }
}

const storage = createMmkvStorage();
const persister = createSyncStoragePersister({
  storage,
  key: QUERY_CACHE_KEY,
  throttleTime: 1000,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
    },
  },
});

export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: PERSIST_MAX_AGE_MS,
};
