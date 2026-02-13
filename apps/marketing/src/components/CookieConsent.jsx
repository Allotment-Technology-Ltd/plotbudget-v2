import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'plot_cookie_consent';

export function getStoredConsent() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      essential: parsed.essential !== false,
      analytics: Boolean(parsed.analytics),
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

function saveConsent(consent) {
  if (typeof window === 'undefined') return;
  const payload = {
    ...consent,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (consent.analytics) {
    import('@vercel/analytics').then(({ inject }) => inject()).catch(() => {});
    import('@vercel/speed-insights').then(({ injectSpeedInsights }) => injectSpeedInsights()).catch(() => {});
  }
  window.dispatchEvent(new CustomEvent('plot_cookie_consent_updated', { detail: payload }));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
      return;
    }
    setVisible(false);
    setAnalyticsOn(stored.analytics);
  }, []);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('plot_show_cookie_settings', handler);
    return () => window.removeEventListener('plot_show_cookie_settings', handler);
  }, []);

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true });
    setVisible(false);
    setCustomiseOpen(false);
  };

  const essentialOnly = () => {
    saveConsent({ essential: true, analytics: false });
    setVisible(false);
    setCustomiseOpen(false);
  };

  const saveCustomise = () => {
    saveConsent({ essential: true, analytics: analyticsOn });
    setVisible(false);
    setCustomiseOpen(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-label="Cookie preferences"
        aria-describedby="cookie-consent-description"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-plot-surface border-t border-plot-border shadow-lg"
      >
        <div className="content-wrapper">
          <div className="flex flex-col gap-4">
            <p id="cookie-consent-description" className="font-body text-sm text-plot-muted max-w-2xl">
              We use <strong className="text-plot-text">essential cookies</strong> to remember your
              cookie choices and keep the site working. We may use <strong className="text-plot-text">analytics cookies</strong> to
              improve the site. You can accept all, use essential only, or customise below.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <button
                type="button"
                onClick={acceptAll}
                className="btn-primary font-heading text-cta-sm uppercase tracking-widest py-2 px-4"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={essentialOnly}
                className="font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-text border border-plot-border hover:border-plot-border-accent py-2 px-4 rounded transition-colors"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => setCustomiseOpen((v) => !v)}
                className="font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-accent py-2 px-4 transition-colors"
              >
                {customiseOpen ? 'Hide customise' : 'Customise'}
              </button>
            </div>
            {customiseOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-plot-border space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-label-sm uppercase tracking-wider text-plot-text">
                      Essential cookies
                    </p>
                    <p className="text-sm text-plot-muted mt-1">
                      Required to remember your preferences and for the site to function. Cannot be disabled.
                    </p>
                  </div>
                  <span className="shrink-0 text-plot-muted text-sm">Always on</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-label-sm uppercase tracking-wider text-plot-text">
                      Analytics cookies
                    </p>
                    <p className="text-sm text-plot-muted mt-1">
                      Help us understand how the site is used so we can improve it. Optional.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsOn}
                    onClick={() => setAnalyticsOn((v) => !v)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                      analyticsOn ? 'bg-plot-accent' : 'bg-plot-border'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        analyticsOn ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={saveCustomise}
                  className="btn-primary font-heading text-cta-sm uppercase tracking-widest py-2 px-4"
                >
                  Save preferences
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
