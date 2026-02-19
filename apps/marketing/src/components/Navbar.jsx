import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/** Mobile menu: full-width block links (used in drawer) — hover uses WCAG 2.2 compliant accent */
const navLinkClass =
  'font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-accent-text transition-colors block w-full text-left py-3';

/** Desktop nav link (center group): single-line, no wrap */
const desktopNavLinkClass =
  'font-heading text-label-sm uppercase tracking-wider text-plot-muted hover:text-plot-accent-text transition-colors whitespace-nowrap py-2 px-1 min-h-[44px] flex items-center justify-center';

/**
 * Navbar — Sticky navigation with frosted glass backdrop.
 *
 * Features:
 *  - Hide-on-scroll-down / show-on-scroll-up (reduces distraction per Hick's Law)
 *  - Theme toggle (sun/moon)
 *  - Desktop (md+): logo left, nav links centered, Log in + Sign up right (clean spacing)
 *  - Mobile/small: hamburger menu reveals Pricing, Principles, Story, Roadmap, Log in
 */
export default function Navbar({ theme, onToggleTheme, pricingEnabled = false, appUrl = 'https://app.plotbudget.com' }) {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const scrollToPricing = () => {
    setMenuOpen(false);
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [menuOpen]);

  return (
    <motion.nav
      role="navigation"
      aria-label="Main navigation"
      initial={{ y: -80 }}
      animate={{ y: visible ? 0 : -80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`
        fixed top-0 left-0 right-0 z-50 h-16 w-full
        flex items-center
        px-6 md:px-10
        transition-colors duration-300
        ${atTop
          ? 'bg-transparent'
          : 'bg-plot-bg/80 backdrop-blur-xl border-b border-plot-border'
        }
      `}
    >
      {/* Desktop (md+): three zones — left (logo), center (nav links), right (Log in, Sign up, theme) */}
      <div className="hidden md:flex items-center flex-1 min-w-0 w-full">
        {/* Left: logo + wordmark — clear space, no shrink */}
        <div className="flex items-center flex-1 justify-start min-w-0">
          <Link
            to="/"
            onClick={(e) => {
              if (window.location.pathname !== '/') return;
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 font-display font-bold text-2xl text-plot-accent-text tracking-[0.25em] hover:text-glow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 rounded"
            aria-label="PLOT — return to top"
          >
            <img
              src={theme === 'dark' ? '/favicon-dark.svg' : '/favicon.svg'}
              alt=""
              width={32}
              height={32}
              className="shrink-0 w-8 h-8 object-contain"
            />
            <span>PLOT</span>
          </Link>
        </div>

        {/* Center: nav links — truly centered in viewport */}
        <nav className="flex items-center justify-center gap-6 lg:gap-8 shrink-0 px-4" aria-label="Primary">
          {pricingEnabled && (
            pathname === '/' ? (
              <button
                onClick={scrollToPricing}
                className={desktopNavLinkClass}
                aria-label="View pricing"
              >
                Pricing
              </button>
            ) : (
              <Link to="/#pricing" className={desktopNavLinkClass}>
                Pricing
              </Link>
            )
          )}
          <Link to="/principles" className={desktopNavLinkClass}>
            Principles
          </Link>
          <Link to="/features" className={desktopNavLinkClass}>
            Features
          </Link>
          <Link to="/story" className={desktopNavLinkClass}>
            Story
          </Link>
          <Link to="/roadmap" className={desktopNavLinkClass}>
            Roadmap
          </Link>
        </nav>

        {/* Right: Log in (text), Sign up (CTA), theme — clear space */}
        <div className="flex items-center flex-1 justify-end gap-4 lg:gap-6 min-w-0">
          <a
            href={`${appUrl}/login`}
            className={`${desktopNavLinkClass} text-plot-muted hover:text-plot-accent-text`}
            aria-label="Log in to PLOT"
          >
            Log in
          </a>
          <a
            href={`${appUrl}/signup`}
            className="
              font-heading text-cta-sm uppercase tracking-[0.2em]
              bg-plot-accent text-on-accent px-5 py-2.5
              hover:shadow-[0_0_20px_var(--accent-glow)] hover:-translate-y-px
              transition-all duration-200 rounded-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2
            "
            aria-label="Sign up for PLOT"
          >
            Sign up
          </a>
          <button
            type="button"
            onClick={onToggleTheme}
            className="
              shrink-0 w-10 h-10 flex items-center justify-center
              bg-plot-surface border border-plot-border text-plot-muted
              hover:text-plot-accent-text hover:border-plot-border-accent hover:bg-plot-elevated
              focus:outline-none focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]
              transition-all duration-200 rounded-none
            "
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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
      </div>

      {/* Mobile: logo left, hamburger + theme right */}
      <div className="flex items-center justify-between md:hidden w-full">
        <Link
          to="/"
          onClick={(e) => {
            if (window.location.pathname !== '/') return;
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 font-display font-bold text-2xl text-plot-accent-text tracking-[0.25em] hover:text-glow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 rounded"
          aria-label="PLOT — return to top"
        >
          <img
            src={theme === 'dark' ? '/favicon-dark.svg' : '/favicon.svg'}
            alt=""
            width={32}
            height={32}
            className="shrink-0 w-8 h-8 object-contain"
          />
          <span>PLOT</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex flex-col items-center justify-center gap-1.5 border border-plot-border text-plot-muted hover:text-plot-accent-text hover:border-plot-border-accent transition-all rounded-none"
            aria-expanded={menuOpen}
            aria-controls="nav-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
          <span className={`w-4 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`w-4 h-0.5 bg-current transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-4 h-0.5 bg-current transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="
            shrink-0 w-10 h-10 flex items-center justify-center
            bg-plot-surface border border-plot-border text-plot-muted
            hover:text-plot-accent-text hover:border-plot-border-accent hover:bg-plot-elevated
            focus:outline-none focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]
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
      </div>

      {/* Mobile menu panel — slides down below navbar */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              id="nav-menu"
              role="dialog"
              aria-label="Navigation menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 right-0 top-16 z-40 overflow-hidden border-b border-plot-border bg-plot-bg/98 backdrop-blur-xl md:hidden"
            >
              <nav className="px-6 py-4 flex flex-col gap-0" aria-label="Mobile navigation">
                {pricingEnabled && (
                  pathname === '/' ? (
                    <button onClick={scrollToPricing} className={navLinkClass}>
                      Pricing
                    </button>
                  ) : (
                    <Link to="/#pricing" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                      Pricing
                    </Link>
                  )
                )}
                <Link to="/principles" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                  Principles
                </Link>
                <Link to="/features" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                  Features
                </Link>
                <Link to="/story" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                  Story
                </Link>
                <Link to="/roadmap" onClick={() => setMenuOpen(false)} className={navLinkClass}>
                  Roadmap
                </Link>
                <a
                  href={`${appUrl}/login`}
                  onClick={() => setMenuOpen(false)}
                  className={navLinkClass}
                >
                  Log in
                </a>
                <a
                  href={`${appUrl}/signup`}
                  onClick={() => setMenuOpen(false)}
                  className="font-heading text-label-sm uppercase tracking-wider text-plot-accent-text hover:text-plot-accent-text block w-full text-left py-3 mt-2 border-t border-plot-border pt-4"
                >
                  Sign up
                </a>
              </nav>
            </motion.div>
            <motion.button
              type="button"
              tabIndex={-1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 z-30 bg-plot-text/10 md:hidden"
              aria-label="Close menu"
            />
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
