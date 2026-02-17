import { Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { APP_URL, PRICING_ENABLED } from '../lib/config';
import SEO from './SEO';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieConsent from './CookieConsent';

/**
 * Shared layout for all marketing pages: Navbar, main content (Outlet), Footer, CookieConsent.
 */
export default function Layout() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <SEO />
      <Navbar
        theme={theme}
        onToggleTheme={toggle}
        pricingEnabled={PRICING_ENABLED}
        appUrl={APP_URL}
      />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer pricingEnabled={PRICING_ENABLED} appUrl={APP_URL} />
      <CookieConsent />
    </>
  );
}
