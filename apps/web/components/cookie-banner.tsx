'use client';

import { useEffect, useState } from 'react';
import { useCookieConsent } from './providers/cookie-consent-context';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

export function CookieBanner() {
  const {
    consent,
    hasChosen,
    ready,
    setConsent,
    showBanner,
    setShowBanner,
  } = useCookieConsent();
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  const shouldShow = ready && (!hasChosen || showBanner);

  useEffect(() => {
    if (consent) setAnalyticsOn(consent.analytics);
  }, [consent]);

  const acceptAll = () => {
    setConsent({ essential: true, analytics: true });
    setCustomiseOpen(false);
  };

  const essentialOnly = () => {
    setConsent({ essential: true, analytics: false });
    setCustomiseOpen(false);
  };

  const saveCustomise = () => {
    setConsent({ essential: true, analytics: analyticsOn });
    setCustomiseOpen(false);
  };

  if (!shouldShow) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card p-4 shadow-lg md:p-6"
    >
      <div className="mx-auto max-w-3xl">
        <p
          id="cookie-banner-description"
          className="mb-4 text-sm text-muted-foreground"
        >
          We use <strong className="text-foreground">essential cookies</strong> to
          keep you logged in and to run PLOT. If you do not accept essential
          cookies, you will not be able to use the app. We may use{' '}
          <strong className="text-foreground">analytics cookies</strong> to
          improve the product; you can refuse them and still use PLOT.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={acceptAll} variant="primary" data-testid="cookie-accept-all">
            Accept all
          </Button>
          <Button type="button" onClick={essentialOnly} variant="outline" data-testid="cookie-essential-only">
            Essential only
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCustomiseOpen((v) => !v)}
            className="text-muted-foreground"
          >
            {customiseOpen ? 'Hide customise' : 'Customise'}
          </Button>
          {showBanner && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground"
            >
              Close
            </Button>
          )}
        </div>
        {customiseOpen && (
          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Essential cookies
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Required to log in and use PLOT. Cannot be disabled.
                </p>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                Always on
              </span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">
                  Analytics cookies
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Help us improve PLOT. Optional.
                </p>
              </div>
              <Switch
                checked={analyticsOn}
                onCheckedChange={setAnalyticsOn}
                aria-label="Allow analytics cookies"
              />
            </div>
            <Button type="button" onClick={saveCustomise} variant="primary">
              Save preferences
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
