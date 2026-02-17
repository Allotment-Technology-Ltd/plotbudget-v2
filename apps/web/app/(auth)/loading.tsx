import { AuthLoadingClient } from './auth-loading-client';

/**
 * Shown while auth route segments (login, signup, reset-password) are loading.
 * Message is context-specific; uses pulsing indicator to match app aesthetic.
 */
export default function AuthLoading() {
  return <AuthLoadingClient />;
}
