import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App';
import { getStoredConsent } from './components/CookieConsent';
import './index.css';

// Only load analytics if user has already consented (e.g. returning visit)
const consent = getStoredConsent();
if (consent?.analytics) {
  inject();
  injectSpeedInsights();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
);
