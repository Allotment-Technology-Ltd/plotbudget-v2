'use server';

import { isEmailAllowed } from '@/lib/auth/allowlist';

export async function checkEmailAllowed(email: string): Promise<boolean> {
  return isEmailAllowed(email);
}
