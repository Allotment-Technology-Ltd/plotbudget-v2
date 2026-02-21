'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Persist in localStorage so splash shows at most once per browser/device, not every session */
const STORAGE_KEY = 'plot-splash-shown';
const TAGLINE = 'Household Operating System.';

/** P logo paths (same as icon.tsx) – stroked, no animation */
const P_PATH_1 =
  'M224.8 131.2H141.6C135.856 131.2 131.2 135.856 131.2 141.6V370.4C131.2 376.144 135.856 380.8 141.6 380.8H224.8C230.544 380.8 235.2 376.144 235.2 370.4V141.6C235.2 135.856 230.544 131.2 224.8 131.2Z';
const P_PATH_2 =
  'M370.4 131.2H266.4C260.656 131.2 256 135.856 256 141.6V256C256 261.744 260.656 266.4 266.4 266.4H370.4C376.144 266.4 380.8 261.744 380.8 256V141.6C380.8 135.856 376.144 131.2 370.4 131.2Z';

const MINT = '#69F0AE';
const TAGLINE_STAGGER_MS = 45;
const HOLD_AFTER_TAGLINE_MS = 500;
const FADE_OUT_MS = 400;

export function PwaSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') {
      queueMicrotask(() => setMounted(true));
      return;
    }
    queueMicrotask(() => {
      setVisible(true);
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (!visible || typeof window === 'undefined') return;

    const totalMs =
      TAGLINE.length * TAGLINE_STAGGER_MS +
      HOLD_AFTER_TAGLINE_MS +
      FADE_OUT_MS;

    const t = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1');
      setExiting(true);
    }, totalMs - FADE_OUT_MS);

    return () => clearTimeout(t);
  }, [visible]);

  const handleFadeComplete = () => {
    if (exiting) setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111]"
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: FADE_OUT_MS / 1000, ease: 'easeInOut' }}
      onAnimationComplete={handleFadeComplete}
    >
      <div className="flex flex-col items-center gap-8">
        <svg
          viewBox="0 0 512 512"
          className="h-24 w-24 sm:h-28 sm:w-28"
          fill="none"
          aria-hidden
        >
          <path
            d={P_PATH_1}
            stroke={MINT}
            strokeWidth={16}
            strokeLinejoin="round"
          />
          <path
            d={P_PATH_2}
            stroke={MINT}
            strokeWidth={16}
            strokeLinejoin="round"
          />
        </svg>
        <p
          className="font-heading text-sm uppercase tracking-widest text-[#69F0AE] sm:text-base"
          aria-label={TAGLINE}
        >
          {TAGLINE.split('').map((char, i) => (
            <motion.span
              key={`${i}-${char}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.15,
                delay: (i * TAGLINE_STAGGER_MS) / 1000,
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </p>
      </div>
    </motion.div>
  );
}
