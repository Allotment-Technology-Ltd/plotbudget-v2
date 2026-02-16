/**
 * Safe wrapper for PushAndDeepLinkHandler. In Expo Go, push notifications are not
 * supported (removed in SDK 53), so we render null and never load expo-notifications.
 * In a development build, we load and render the real handler.
 */

import Constants from 'expo-constants';
import React from 'react';

const isExpoGo = Constants.appOwnership === 'expo';

export function PushAndDeepLinkHandlerSafe() {
  if (isExpoGo) {
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic load so Expo Go never imports expo-notifications
  const { PushAndDeepLinkHandler } = require('./PushAndDeepLinkHandler');
  return <PushAndDeepLinkHandler />;
}
