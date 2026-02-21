import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../lib/animationUtils';
import { APP_URL } from '../lib/config';

function TerminalHeadline({ text }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedChars(text.length);
      return;
    }

    let intervalId;
    const startDelay = setTimeout(() => {
      let i = 0;
      intervalId = setInterval(() => {
        i++;
        setDisplayedChars(i);
        if (i >= text.length) clearInterval(intervalId);
      }, 50);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, prefersReducedMotion]);

  useEffect(() => {
    if (displayedChars >= text.length) {
      const timeout = setTimeout(() => setShowCursor(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [displayedChars, text.length]);

  return (
    <h1
      id="hero-headline"
      className="
        font-display font-bold
        text-display-sm md:text-display-lg
        uppercase text-plot-text
        max-w-prose text-glow
      "
      aria-label={text}
    >
      <span aria-hidden="true">
        {text.slice(0, displayedChars)}
      </span>
      {showCursor && (
        <span className="cursor-blink" aria-hidden="true" />
      )}
    </h1>
  );
}

export default function Hero() {
  return (
    <section
      className="
        relative min-h-screen flex items-center justify-center
        bg-plot-bg pt-16
      "
      aria-labelledby="hero-headline"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, var(--accent-glow), transparent)',
        }}
      />

      <div className="content-wrapper relative z-10 flex flex-col items-center text-center gap-6 md:gap-8 py-12">
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="section-label"
        >
          The household operating system. Privacy by default.
        </motion.p>

        <TerminalHeadline text="YOUR HOUSEHOLD. FINALLY ORGANISED." />

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
          className="font-body text-lg md:text-xl text-plot-muted max-w-narrow"
        >
          One home. One rhythm. No tracking.
        </motion.p>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.9}
          className="font-heading text-label-sm md:text-label uppercase tracking-wider text-plot-accent-text"
        >
          First 100 households get free access for 12 months.
        </motion.p>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1.0}
          className="w-full flex flex-col items-center gap-4 mt-2"
        >
          <a
            href={APP_URL}
            className="btn-primary text-cta-sm px-8 py-3 font-heading uppercase tracking-widest"
            aria-label="Join as a founding household"
          >
            Join as a founding household
          </a>
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1.2}
          className="flex items-center gap-2 font-heading text-label-sm md:text-label uppercase tracking-wider text-plot-muted"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="0" ry="0" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          No bank connections required. Your data stays yours.
        </motion.p>
      </div>
    </section>
  );
}
