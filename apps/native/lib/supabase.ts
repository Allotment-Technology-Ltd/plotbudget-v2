/**
 * Supabase client for React Native.
 * Uses AsyncStorage for session persistence on device/web runtime.
 * During `expo export --platform web` (Node/static rendering), window is
 * undefined so we use a no-op storage to avoid "window is not defined".
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@repo/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** No-op storage for Node/SSR (expo export --platform web) where window is undefined. */
const noopStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void } = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getAuthStorage() {
  if (typeof window === 'undefined') {
    return noopStorage;
  }
  return AsyncStorage;
}

export function createSupabaseClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: getAuthStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createSupabaseClient();
