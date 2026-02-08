import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navbar — Sticky navigation with frosted glass backdrop.
 *
 * Features:
 *  - Hide-on-scroll-down / show-on-scroll-up (reduces distraction per Hick's Law)
 *  - Theme toggle (sun/moon)
 *  - "JOIN WAITLIST" CTA scrolls to hero form
 *  - Responsive: CTA text shortens on mobile
 */
export default function Navbar({ theme, onToggleTheme, pricingEnabled = false }) {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [atTop, setAtTop] = useState(true);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    setAtTop(currentY < 10);

    if (currentY > lastScrollY && currentY > 80) {
      setVisible(false); // scrolling down — hide
    } else {
      setVisible(true); // scrolling up — show
    }

    setLastScrollY(currentY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToForm = () => {
    const el = document.getElementById('hero-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <motion.nav
      role="navigation"
      aria-label="Main navigation"
      initial={{ y: -80 }}
      animate={{ y: visible ? 0 : -80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        fixed top-0 left-0 right-0 z-50 h-16
        flex items-center justify-between
        px-6 md:px-10
        transition-colors duration-300
        ${atTop
          ? 'bg-transparent'
          : 'bg-plot-bg/80 backdrop-blur-xl border-b border-plot-border'
        }
      `}
    >
      {/* Logo */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="font-display font-bold text-2xl text-plot-accent tracking-[0.25em] hover:text-glow transition-all"
        aria-label="PLOT — return to top"
      >
        PLOT
      </a>

      {/* Right side: Pricing + Log in + Join link + theme toggle */}
      <div className="flex items-center gap-4">
        {/* Pricing — scrolls to pricing section when pricing is enabled */}
        {pricingEnabled && (
          <button
            onClick={scrollToPricing}
            className="font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-accent transition-colors hidden sm:inline"
            aria-label="View pricing"
          >
            Pricing
          </button>
        )}
        {/* Log in — primary CTA; use VITE_APP_URL locally so login stays on local app */}
        <a
          href={`${import.meta.env.VITE_APP_URL || 'https://app.plotbudget.com'}/login`}
          className="btn-primary text-cta-sm"
          aria-label="Log in to PLOT"
        >
          Log in
        </a>
        {/* Join waitlist — secondary, scrolls to form */}
        <button
          onClick={scrollToForm}
          className="font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-accent transition-colors hidden sm:inline"
          aria-label="Join the PLOT waitlist"
        >
          <span className="hidden xs:inline">Join waitlist</span>
          <span className="xs:hidden">Join</span>
        </button>
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="
            w-10 h-10 flex items-center justify-center
            border border-plot-border text-plot-muted
            hover:text-plot-accent hover:border-plot-border-accent
            transition-all duration-200
          "
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{ borderRadius: 0 }}
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.svg
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </motion.svg>
            ) : (
              <motion.svg
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.nav>
  );
}
