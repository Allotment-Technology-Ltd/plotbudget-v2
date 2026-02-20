import { createClient } from '@sanity/client';

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || 'a2vzaekn';
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production';

let client = null;

/** Lazy client so proxy config is applied in the browser (window exists), not at bundle/load time. */
export function getSanityClient() {
  if (client) return client;
  const isDev = import.meta.env.DEV;
  const inBrowser = typeof window !== 'undefined';
  const useProxy = isDev && inBrowser;
  client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: false,
    ...(useProxy
      ? {
          useProjectHostname: false,
          apiHost: `${window.location.origin}/sanity-api`,
        }
      : {}),
  });
  return client;
}
