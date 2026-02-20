import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MailerLiteForm — Email waitlist capture with full state management.
 *
 * States: IDLE → LOADING → SUCCESS | ERROR
 *
 * Architecture:
 *   The form POSTs to /api/subscribe (a Vercel serverless function)
 *   which proxies the request to MailerLite's API. This keeps the
 *   API key server-side and avoids CORS issues.
 *
 *   For local development, you can set up a Vercel dev server
 *   (`npx vercel dev`) or temporarily use direct API calls.
 *
 * Props:
 *   variant: 'hero' | 'footer' — adjusts layout (inline vs stacked)
 *   id:      string — unique id for scroll targeting
 */

const STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function MailerLiteForm({ variant = 'hero', id = 'hero-form' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(STATES.IDLE);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation (Postel's Law: accept flexible input)
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !isValidEmail(trimmed)) {
      setStatus(STATES.ERROR);
      setErrorMsg('Please enter a valid email address.');
      inputRef.current?.focus();
      return;
    }

    setStatus(STATES.LOADING);
    setErrorMsg('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || 'Something went wrong. Please try again.'
        );
      }

      setStatus(STATES.SUCCESS);
      setEmail('');
    } catch (err) {
      setStatus(STATES.ERROR);
      setErrorMsg(err.message || 'Network error. Please check your connection.');
    }
  };

  const resetForm = () => {
    setStatus(STATES.IDLE);
    setErrorMsg('');
    setEmail('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Layout classes vary by variant
  const isHero = variant === 'hero';
  const formLayout = isHero
    ? 'flex flex-col md:flex-row gap-3 w-full max-w-narrow'
    : 'flex flex-col sm:flex-row gap-3 w-full max-w-narrow';

  return (
    <div id={id} className="w-full flex flex-col items-center">
      <AnimatePresence mode="wait">
        {/* ─── SUCCESS STATE ─── */}
        {status === STATES.SUCCESS ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-3"
          >
            {/* Checkmark animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              className="
                w-14 h-14 mx-auto flex items-center justify-center
                border-2 border-plot-accent text-plot-accent-text
              "
              style={{ borderRadius: 0 }}
              aria-hidden="true"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>

            <p className="font-heading text-sub-sm md:text-sub uppercase tracking-wider text-plot-accent-text">
              You're on the list.
            </p>
            <p className="font-body text-base text-plot-muted">
              We'll be in touch soon. Welcome to PLOT.
            </p>
          </motion.div>
        ) : (

        /* ─── FORM (IDLE / LOADING / ERROR) ─── */
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            noValidate
            className={formLayout}
            aria-label="Get PLOT product updates by email"
          >
            {/* Email input */}
            <div className="flex-1 relative">
              <label htmlFor={`email-${id}`} className="sr-only">
                Email address
              </label>
              <input
                ref={inputRef}
                id={`email-${id}`}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === STATES.ERROR) setStatus(STATES.IDLE);
                }}
                disabled={status === STATES.LOADING}
                aria-invalid={status === STATES.ERROR}
                aria-describedby={status === STATES.ERROR ? `error-${id}` : undefined}
                className={`
                  w-full h-12 md:h-14 px-4
                  bg-plot-surface
                  font-heading text-sm md:text-base text-plot-text
                  placeholder:text-plot-muted/50
                  transition-all duration-200
                  focus:outline-hidden focus:ring-0
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${status === STATES.ERROR
                    ? 'border-2 border-red-500'
                    : 'border border-plot-border-accent focus:border-plot-accent focus:shadow-glow-sm'
                  }
                `}
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={status === STATES.LOADING}
              className="
                btn-primary h-12 md:h-14
                min-w-[160px] md:min-w-[200px]
                relative overflow-hidden
                disabled:opacity-70 disabled:cursor-not-allowed
              "
              aria-label={status === STATES.LOADING ? 'Submitting...' : 'Get product updates by email'}
            >
              <AnimatePresence mode="wait">
                {status === STATES.LOADING ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    {/* Terminal-style loading dots */}
                    <span className="inline-flex gap-1" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-1.5 h-1.5 bg-current"
                          style={{ borderRadius: 0 }}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </span>
                    <span>PROCESSING</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Get updates
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {status === STATES.ERROR && errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center gap-2"
          >
            <p
              id={`error-${id}`}
              role="alert"
              className="font-heading text-label-sm text-red-500 uppercase tracking-wider"
            >
              {errorMsg}
            </p>
            <button
              onClick={resetForm}
              className="font-heading text-label-sm text-plot-muted underline hover:text-plot-accent-text transition-colors uppercase tracking-wider"
              aria-label="Dismiss error and try again"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
