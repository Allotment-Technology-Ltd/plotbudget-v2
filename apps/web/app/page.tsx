import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Root path: no holding page. Redirect to login (or dashboard if authenticated).
 * Middleware also redirects / → /login or /dashboard; this is the fallback and keeps the app root minimal.
 */
export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');
  redirect('/login');
}
