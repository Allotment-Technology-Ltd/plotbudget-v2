import { describe, it, expect, afterEach } from 'vitest';
import { getAppBaseUrl } from './app-url';

describe('getAppBaseUrl', () => {
  const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const origVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    process.env.VERCEL_URL = origVercelUrl;
  });

  it('returns NEXT_PUBLIC_APP_URL when set', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.plotbudget.com';
    process.env.VERCEL_URL = 'preview-abc.vercel.app';
    expect(getAppBaseUrl()).toBe('https://app.plotbudget.com');
  });

  it('strips trailing slash from NEXT_PUBLIC_APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.plotbudget.com/';
    delete process.env.VERCEL_URL;
    expect(getAppBaseUrl()).toBe('https://app.plotbudget.com');
  });

  it('returns https + VERCEL_URL when NEXT_PUBLIC_APP_URL is unset and VERCEL_URL is set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = 'my-branch-plotbudget.vercel.app';
    expect(getAppBaseUrl()).toBe('https://my-branch-plotbudget.vercel.app');
  });

  it('returns localhost when both are unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    expect(getAppBaseUrl()).toBe('http://localhost:3000');
  });
});
