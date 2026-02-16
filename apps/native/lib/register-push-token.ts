/**
 * Register Expo push token with the backend so we can send payday and partner notifications.
 * Call when user is signed in and permissions are granted.
 * Accepts optional preferences to store per-token (payday, partner, bills_marked_paid).
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PushPreferenceFlags } from '@/contexts/PushPreferencesContext';
import { getAuthHeaders } from './auth-headers';

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const projectId = (await import('expo-constants')).default.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenData.data ?? null;
}

export async function registerPushToken(
  preferences?: PushPreferenceFlags
): Promise<{ ok: boolean; error?: string }> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) return { ok: false, error: 'No push token (permission or not a device)' };

  const headers = await getAuthHeaders();
  if (!headers) return { ok: false, error: 'Not signed in' };

  const baseUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  if (!baseUrl) return { ok: false, error: 'EXPO_PUBLIC_APP_URL not set' };

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  const body: {
    token: string;
    platform: 'ios' | 'android';
    paydayReminders?: boolean;
    partnerActivity?: boolean;
    billsMarkedPaid?: boolean;
  } = { token: pushToken, platform };
  if (preferences) {
    body.paydayReminders = preferences.paydayReminders;
    body.partnerActivity = preferences.partnerActivity;
    body.billsMarkedPaid = preferences.billsMarkedPaid;
  }

  const res = await fetch(`${baseUrl}/api/push-tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok) return { ok: false, error: json.error ?? `Request failed (${res.status})` };
  return { ok: true };
}

