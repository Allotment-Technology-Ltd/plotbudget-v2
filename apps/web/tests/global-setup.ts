// apps/web/tests/global-setup.ts
// Runs once in the main process before tests. Writes auth state to the path
// the config uses for storageState so path is always the same.
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { chromium, type FullConfig } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import {
  cleanupAllTestUsers,
  ensureAuthUserExists,
  ensureUserInPublicUsers,
  ensureBlueprintReady,
} from './utils/db-cleanup';
import { TEST_USERS } from './fixtures/test-data';

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
};

export default async function globalSetup(config: FullConfig) {
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

  // When SKIP_WEBSERVER=1, assume dev server is already running (fail fast if not).
  const skipWebServer = process.env.SKIP_WEBSERVER === '1';
  const probeMs = skipWebServer ? 15000 : 3000;
  let serverStarted = false;
  const alreadyUp = await waitForServer(baseURL, probeMs);
  if (!alreadyUp) {
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

  // Create auth users if missing
  await ensureAuthUserExists(TEST_USERS.blueprint.email, TEST_USERS.blueprint.password);
  await ensureAuthUserExists(TEST_USERS.ritual.email, TEST_USERS.ritual.password);
  await ensureAuthUserExists(TEST_USERS.dashboard.email, TEST_USERS.dashboard.password);

  // Sync to public.users and set household + onboarding done BEFORE login so saved state is "ready"
  await ensureUserInPublicUsers(TEST_USERS.solo.email);
  await ensureUserInPublicUsers(TEST_USERS.blueprint.email);
  await ensureUserInPublicUsers(TEST_USERS.ritual.email);
  await ensureUserInPublicUsers(TEST_USERS.dashboard.email);
  await ensureBlueprintReady(TEST_USERS.blueprint.email);
  await ensureBlueprintReady(TEST_USERS.ritual.email);
  await ensureBlueprintReady(TEST_USERS.dashboard.email);

  const browser = await chromium.launch();
  for (const project of projectsWithAuth) {
    const authStatePath = project.use!.storageState as string;
    const auth = PROJECT_AUTH[project.name]!;

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${baseURL}/login`);
    await page.getByTestId('email-input').fill(auth.email);
    await page.getByTestId('password-input').fill(auth.password);
    await page.getByTestId('submit-login-form').click();
    await page.waitForURL(/\/(dashboard|onboarding|\?)/);

    await context.storageState({ path: authStatePath });
    await context.close();
  }
  await browser.close();

  if (serverStarted) {
    console.log('✅ Global setup: server started, auth states saved (solo + blueprint)');
  } else {
    console.log('✅ Global setup: auth states saved (solo + blueprint)');
  }
}
