// apps/web/tests/global-setup.ts
// Runs once in the main process before tests. Writes auth state to the path
// the config uses for storageState so path is always the same.
// Auth state is created programmatically via Supabase (no login UI) so we don't depend on the login page rendering.
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import type { FullConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import {
  cleanupAllTestUsers,
  ensureAuthUserExists,
  ensureUserInPublicUsers,
  ensureBlueprintReady,
  ensurePartnerInviteReady,
  resetOnboardingState,
  userHasHousehold,
} from './utils/db-cleanup';
import { TEST_USERS, E2E_PARTNER_INVITE_TOKEN, COOKIE_CONSENT_LOCALSTORAGE } from './fixtures/test-data';

// Load env (same as playwright.config.ts)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env.test.local') });

async function waitForServer(url: string, timeoutMs = 120000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

/** Which user to log in as per project; users are set up (DB) before login so saved state is "ready" */
const PROJECT_AUTH: Record<string, { email: string; password: string }> = {
  chromium: {
    email: TEST_USERS.solo.email,
    password: TEST_USERS.solo.password,
  },
  'chromium-blueprint': {
    email: TEST_USERS.blueprint.email,
    password: TEST_USERS.blueprint.password,
  },
  'chromium-ritual': {
    email: TEST_USERS.ritual.email,
    password: TEST_USERS.ritual.password,
  },
  'chromium-dashboard': {
    email: TEST_USERS.dashboard.email,
    password: TEST_USERS.dashboard.password,
  },
  'chromium-settings': {
    email: TEST_USERS.settings.email,
    password: TEST_USERS.settings.password,
  },
  'chromium-onboarding': {
    email: TEST_USERS.onboarding.email,
    password: TEST_USERS.onboarding.password,
  },
  'visual-desktop': {
    email: TEST_USERS.visual.email,
    password: TEST_USERS.visual.password,
  },
  'visual-mobile': {
    email: TEST_USERS.visual.email,
    password: TEST_USERS.visual.password,
  },
};

export default async function globalSetup(config: FullConfig) {
  console.log('⏳ Global setup: starting…');
  const baseURL = String(config.projects?.[0]?.use?.baseURL || 'http://localhost:3000');
  const projectsWithAuth = (config.projects ?? []).filter(
    (p) => p.use?.storageState && PROJECT_AUTH[p.name]
  );

  if (projectsWithAuth.length === 0) {
    throw new Error('No project with storageState and PROJECT_AUTH mapping found');
  }

  const authDir = path.dirname(projectsWithAuth[0].use!.storageState as string);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await cleanupAllTestUsers();
  console.log('⏳ Global setup: checking server…');

  // When SKIP_WEBSERVER=1, assume dev server is already running (fail fast if not).
  const skipWebServer = process.env.SKIP_WEBSERVER === '1';
  const probeMs = skipWebServer ? 15000 : 3000;
  let serverStarted = false;
  const alreadyUp = await waitForServer(baseURL, probeMs);
  if (!alreadyUp) {
    console.log('⏳ Global setup: server not ready, starting pnpm dev (may take 30–90s)…');
    if (skipWebServer) {
      throw new Error(
        `Server at ${baseURL} not reachable. Start the app (pnpm dev) in another terminal, or run without SKIP_WEBSERVER=1.`
      );
    }
    const dev = spawn('pnpm', ['dev'], {
      cwd: process.cwd(),
      stdio: 'ignore',
      shell: true,
    });
    serverStarted = await waitForServer(baseURL);
    if (!serverStarted) {
      dev.kill();
      throw new Error(`Server at ${baseURL} did not become ready in time.`);
    }
  }

  // Warm up heavy routes so webpack compiles them before parallel tests hit them simultaneously.
  // Without this, multiple workers requesting an uncompiled route can trigger a webpack memory-cache
  // race ("Cannot read properties of undefined (reading 'call')") that crashes the page.
  console.log('⏳ Global setup: warming up routes…');
  const warmupRoutes = ['/dashboard', '/dashboard/settings', '/dashboard/blueprint'];
  for (const route of warmupRoutes) {
    try {
      await fetch(`${baseURL}${route}`, { method: 'GET', redirect: 'follow' }).catch(() => {});
      // Give webpack a moment between compilations to avoid cache contention
      await new Promise((r) => setTimeout(r, 500));
    } catch {
      // Warmup is best-effort; test suite will still run
    }
  }

  // Create auth users if missing
  await ensureAuthUserExists(TEST_USERS.solo.email, TEST_USERS.solo.password);
  await ensureAuthUserExists(TEST_USERS.blueprint.email, TEST_USERS.blueprint.password);
  await ensureAuthUserExists(TEST_USERS.ritual.email, TEST_USERS.ritual.password);
  await ensureAuthUserExists(TEST_USERS.dashboard.email, TEST_USERS.dashboard.password);
  await ensureAuthUserExists(TEST_USERS.settings.email, TEST_USERS.settings.password);
  await ensureAuthUserExists(TEST_USERS.partner.email, TEST_USERS.partner.password);
  await ensureAuthUserExists(TEST_USERS.onboarding.email, TEST_USERS.onboarding.password);
  await ensureAuthUserExists(TEST_USERS.visual.email, TEST_USERS.visual.password);

  // Sync to public.users and set household + onboarding done BEFORE login so saved state is "ready"
  await ensureUserInPublicUsers(TEST_USERS.solo.email);
  await ensureUserInPublicUsers(TEST_USERS.blueprint.email);
  await ensureUserInPublicUsers(TEST_USERS.ritual.email);
  await ensureUserInPublicUsers(TEST_USERS.dashboard.email);
  await ensureUserInPublicUsers(TEST_USERS.settings.email);
  await ensureUserInPublicUsers(TEST_USERS.partner.email);
  await ensureUserInPublicUsers(TEST_USERS.onboarding.email);
  await ensureUserInPublicUsers(TEST_USERS.visual.email);
  await resetOnboardingState(TEST_USERS.onboarding.email);
  await ensureBlueprintReady(TEST_USERS.blueprint.email);
  await ensureBlueprintReady(TEST_USERS.ritual.email);
  await ensureBlueprintReady(TEST_USERS.dashboard.email);
  await ensureBlueprintReady(TEST_USERS.settings.email);
  await ensureBlueprintReady(TEST_USERS.visual.email);

  // Ensure dashboard, settings, and visual have a household so /dashboard/settings doesn't redirect to onboarding → blueprint
  for (const email of [TEST_USERS.dashboard.email, TEST_USERS.settings.email, TEST_USERS.visual.email]) {
    const hasHousehold = await userHasHousehold(email);
    if (!hasHousehold) {
      console.warn(`⚠️  ${email} has no household after ensureBlueprintReady; retrying…`);
      await ensureBlueprintReady(email);
      const retryOk = await userHasHousehold(email);
      if (!retryOk) {
        throw new Error(
          `E2E setup: ${email} must have a household so settings page loads. ensureBlueprintReady failed.`
        );
      }
    }
  }

  // Partner invite e2e: dashboard has pending invite; dashboard household already has paycycle (ensureBlueprintReady above)
  await ensurePartnerInviteReady(
    TEST_USERS.dashboard.email,
    TEST_USERS.partner.email,
    E2E_PARTNER_INVITE_TOKEN
  );
  await ensureBlueprintReady(TEST_USERS.solo.email);
  // Do not link partner to solo here: partner invite test accepts the *dashboard* invite; linking to solo would make partner_user_id match two households and getPartnerContext().maybeSingle() can fail or return wrong one, sending partner to onboarding

  // Create auth state programmatically (no login UI) so we don't depend on the login page rendering
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const baseUrl = new URL(baseURL);
  const domain = baseUrl.hostname;
  const secure = baseUrl.protocol === 'https:';

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const project of projectsWithAuth) {
    const authStatePath = project.use!.storageState as string;
    const auth = PROJECT_AUTH[project.name]!;

    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({ email: auth.email, password: auth.password });

    if (error) {
      throw new Error(`Global setup: sign in failed for ${auth.email}: ${error.message}`);
    }
    if (!session) {
      throw new Error(`Global setup: no session for ${auth.email}`);
    }

    // @supabase/ssr decodes with base64url; use same encoding so getItem() parses the session
    const cookieValue =
      'base64-' + Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url');
    const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

    const storageState = {
      cookies: [
        {
          name: cookieName,
          value: cookieValue,
          domain,
          path: '/',
          expires: expiresAt,
          httpOnly: false,
          secure,
          sameSite: 'Lax' as const,
        },
      ],
      origins: [
        {
          origin: baseURL,
          localStorage: [COOKIE_CONSENT_LOCALSTORAGE],
        },
      ],
    };

    fs.writeFileSync(authStatePath, JSON.stringify(storageState, null, 2), 'utf-8');
  }

  if (serverStarted) {
    console.log('✅ Global setup: server started, auth states saved (solo + blueprint)');
  } else {
    console.log('✅ Global setup: auth states saved (solo + blueprint)');
  }
}
