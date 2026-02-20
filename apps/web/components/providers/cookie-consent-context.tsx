'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'plot_cookie_consent';

export type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  timestamp?: number;
};

function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    return {
      essential: parsed.essential !== false,
      analytics: Boolean(parsed.analytics),
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;
  const payload = { ...consent, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent('plot_cookie_consent_updated', { detail: payload })
  );
}

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  hasChosen: boolean;
  ready: boolean;
  setConsent: (c: CookieConsent) => void;
  openSettings: () => void;
  showBanner: boolean;
  setShowBanner: (v: boolean) => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsentState] = useState<CookieConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setConsentState(getStoredConsent());
      setReady(true);
    });
  }, []);

  const setConsent = useCallback((c: CookieConsent) => {
    saveConsent(c);
    setConsentState(c);
    setShowBanner(false);
  }, []);

  const openSettings = useCallback(() => {
    setShowBanner(true);
  }, []);

  const hasChosen = consent !== null;

  const value = useMemo(
    () => ({
      consent,
      hasChosen,
      ready,
      setConsent,
      openSettings,
      showBanner,
      setShowBanner,
    }),
    [consent, hasChosen, ready, setConsent, openSettings, showBanner]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}

export function useCookieConsentOptional(): CookieConsentContextValue | null {
  return useContext(CookieConsentContext);
}
