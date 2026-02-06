import { useState, useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { useTheme } from './hooks/useTheme';
import SEO from './components/SEO';
import Navbar from './components/Navbar';
import MailerLiteForm from './components/MailerLiteForm';

/* ============================================================
   ANIMATION VARIANTS (shared across sections)
   ============================================================ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/* ============================================================
   APP ROOT
   ============================================================ */

export default function App() {
  const { theme, isDark, toggle } = useTheme();

  return (
    <>
      <SEO />
      <Navbar theme={theme} onToggleTheme={toggle} />

      <main id="main-content">
        <Hero />
        <SocialProofStrip />
        <ProblemSection />
        <SolutionSection />
        <AppShowcase />
        <FeaturesSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}

/* ============================================================
   HERO SECTION
   ============================================================ */

function Hero() {
  return (
    <section
      className="
        relative min-h-screen flex items-center justify-center
        bg-plot-bg pt-16
      "
      aria-labelledby="hero-headline"
    >
      {/* Subtle radial glow behind hero content */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, var(--accent-glow), transparent)',
        }}
      />

      <div className="content-wrapper relative z-10 flex flex-col items-center text-center gap-6 md:gap-8 py-12">
        {/* Eyebrow */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="section-label"
        >
          Budgeting for couples. Privacy by default.
        </motion.p>

        {/* Headline with terminal typing effect */}
        <TerminalHeadline text="PLOT YOUR FUTURE TOGETHER" />

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
          className="font-body text-lg md:text-xl text-plot-muted max-w-narrow"
        >
          The 15-minute payday ritual that keeps both partners on the
          same page — without sharing bank access.
        </motion.p>

        {/* Email form */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1.0}
          className="w-full flex justify-center mt-2"
        >
          <MailerLiteForm variant="hero" id="hero-form" />
        </motion.div>

        {/* Trust indicator */}
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

/* ─── Terminal typing headline ─── */

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

    // Initial delay before typing starts
    const startDelay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayedChars(i);
        if (i >= text.length) clearInterval(interval);
      }, 50); // 50ms per character
      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(startDelay);
  }, [text, prefersReducedMotion]);

  // Hide cursor 1.5s after typing completes
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

/* ============================================================
   SOCIAL PROOF STRIP
   ============================================================ */

function SocialProofStrip() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="bg-plot-overlay py-5 md:py-6 border-y border-plot-border"
      aria-label="Social proof"
    >
      <p className="
        text-center font-heading text-label-sm md:text-label
        uppercase tracking-[0.15em] text-plot-accent
        content-wrapper
      ">
        Built for UK couples who budget with spreadsheets — and want something better.
      </p>
    </motion.section>
  );
}

/* ============================================================
   PROBLEM SECTION
   ============================================================ */

const problems = [
  {
    title: 'One partner manages everything',
    body: 'One of you becomes the "Chancellor of the Household" while the other stays disconnected. Neither feels great about it.',
  },
  {
    title: 'Spreadsheets don\'t scale',
    body: 'You built a Google Sheet. It worked for a while. Now it\'s a monster that only one of you understands, and it breaks every January.',
  },
  {
    title: 'Apps want your bank access',
    body: 'Every budgeting app demands Open Banking. You want to manage your money together — not hand your data to another company.',
  },
];

function ProblemSection() {
  return (
    <section className="section-padding bg-plot-bg" aria-labelledby="problem-headline">
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10"
        >
          <motion.p variants={staggerItem} className="section-label">
            The Problem
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="problem-headline"
            className="section-headline max-w-prose"
          >
            Money is the #1 source of stress in relationships
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {problems.map((p, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="card group hover:border-plot-border-accent transition-colors duration-300"
              >
                <h3 className="
                  font-heading text-sub-sm uppercase tracking-wider
                  text-plot-text mb-4
                  terminal-prompt
                ">
                  {p.title}
                </h3>
                <p className="font-body text-base text-plot-muted leading-relaxed">
                  {p.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   SOLUTION SECTION
   ============================================================ */

const steps = [
  {
    num: '01',
    title: 'Set your blueprint',
    body: 'Add your household bills, savings goals, and debt repayments. Split them between you and your partner however you like — 50/50, 60/40, or any ratio that works for your life.',
  },
  {
    num: '02',
    title: 'Run the ritual',
    body: 'On payday, open PLOT. Review your allocations. Check off bills. Adjust anything that\'s changed. 15 minutes, done.',
  },
  {
    num: '03',
    title: 'Live your month',
    body: 'Your needs are covered. Your savings are growing. Your debt is shrinking. Both of you can see exactly where things stand — without a single awkward conversation about money.',
  },
];

function SolutionSection() {
  return (
    <section
      className="section-padding bg-plot-surface"
      aria-labelledby="solution-headline"
    >
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10"
        >
          <motion.p variants={staggerItem} className="section-label">
            The Solution
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="solution-headline"
            className="section-headline"
          >
            Your 15-minute payday ritual
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow"
          >
            Once a month, on payday, sit down together. Allocate your income.
            Move on with your life. PLOT handles the rest.
          </motion.p>

          <div className="space-y-12 md:space-y-16 pt-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex gap-6 md:gap-10 items-start"
              >
                {/* Step number */}
                <span
                  className="
                    font-display text-5xl md:text-7xl font-bold
                    text-plot-accent opacity-20
                    select-none shrink-0
                    leading-none
                  "
                  aria-hidden="true"
                >
                  {step.num}
                </span>

                <div className="space-y-3">
                  <h3 className="font-heading text-sub-sm md:text-sub uppercase tracking-wider text-plot-text">
                    {step.title}
                  </h3>
                  <p className="font-body text-base md:text-lg text-plot-muted leading-relaxed max-w-prose">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   APP SHOWCASE — Parallax phone mockups
   ============================================================ */

function AppShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Parallax: phones float upward as user scrolls
  const yLeft = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const yRight = useTransform(scrollYProgress, [0, 1], [100, -40]);

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-plot-bg overflow-hidden"
      aria-labelledby="showcase-headline"
    >
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10"
        >
          <motion.p variants={staggerItem} className="section-label">
            The App
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="showcase-headline"
            className="section-headline"
          >
            Two themes. One clear view.
          </motion.h2>
        </motion.div>

        {/* Phone mockups row */}
        <div className="
          flex flex-col md:flex-row items-center justify-center
          gap-8 md:gap-12 mt-12 md:mt-16
        ">
          {/* Dark mode phone */}
          <motion.div
            style={{ y: yLeft }}
            className="phone-frame shadow-glow md:-rotate-3"
          >
            <div className="phone-screen phone-screen-dark">
              {/*
                Replace src with your actual screenshot path.
                Place files in /public/screenshots/
              */}
              <img
                src="/screenshots/dashboard-dark.png"
                alt="PLOT dashboard in dark mode showing budget allocation with mint green accents on a dark background"
                loading="lazy"
                width="280"
                height="560"
              />
            </div>
          </motion.div>

          {/* Light mode phone */}
          <motion.div
            style={{ y: yRight }}
            className="phone-frame shadow-glow md:rotate-3"
          >
            <div className="phone-screen phone-screen-light">
              <img
                src="/screenshots/dashboard-light.png"
                alt="PLOT dashboard in light mode showing budget allocation with green accents on a warm cream background"
                loading="lazy"
                width="280"
                height="560"
              />
            </div>
          </motion.div>
        </div>

        {/* Additional screenshot pairs (optional — uncomment when ready) */}
        {/*
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mt-16">
          <motion.div style={{ y: yLeft }} className="phone-frame shadow-glow-sm md:-rotate-2">
            <div className="phone-screen">
              <img src="/screenshots/blueprint-dark.png" alt="..." loading="lazy" width="280" height="560" />
            </div>
          </motion.div>
          <motion.div style={{ y: yRight }} className="phone-frame shadow-glow-sm md:rotate-2">
            <div className="phone-screen">
              <img src="/screenshots/blueprint-light.png" alt="..." loading="lazy" width="280" height="560" />
            </div>
          </motion.div>
        </div>
        */}
      </div>
    </section>
  );
}

/* ============================================================
   FEATURES SECTION
   ============================================================ */

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Privacy by default',
    body: 'No Open Banking. No data scraping. Your financial data stays on your device and our encrypted servers. Period.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Built for two',
    body: 'PLOT is designed from the ground up for couples. Shared budgets with individual visibility. Together, not merged.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'One ritual. Done.',
    body: '15 minutes on payday. That\'s it. No daily expense tracking. No receipt scanning. Just one focused monthly ritual.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </svg>
    ),
    title: 'Your split. Your rules.',
    body: '50/50? 70/30? Income-proportional? Set your split ratio and PLOT handles the maths on every bill.',
  },
];

function FeaturesSection() {
  return (
    <section className="section-padding bg-plot-surface" aria-labelledby="features-headline">
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10"
        >
          <motion.p variants={staggerItem} className="section-label">
            Why PLOT
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="features-headline"
            className="section-headline"
          >
            What makes PLOT different
          </motion.h2>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="card group hover:border-plot-border-accent hover:shadow-glow-sm transition-all duration-300"
              >
                <div className="text-plot-accent mb-4" aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="
                  font-heading text-sub-sm uppercase tracking-wider
                  text-plot-text mb-3
                ">
                  {f.title}
                </h3>
                <p className="font-body text-base text-plot-muted leading-relaxed">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ SECTION — Accordion
   ============================================================ */

const faqs = [
  {
    q: 'Is PLOT free?',
    a: 'PLOT will launch with a free tier and an affordable premium plan. Early access users will get founding member pricing locked in for life.',
  },
  {
    q: 'Do I need to connect my bank account?',
    a: 'Never. PLOT is privacy-first. You enter your income and bills manually — which is actually faster than you\'d think, because you only do it once and PLOT remembers everything for next month.',
  },
  {
    q: 'What if my partner doesn\'t want to use it?',
    a: 'PLOT works brilliantly for solo use too. But when your partner sees how simple it makes everything, they\'ll want in. You can invite them anytime.',
  },
  {
    q: 'Is this just another budgeting app?',
    a: 'Most budgeting apps want you to track every coffee. PLOT doesn\'t. We believe in allocating your money on payday and then getting on with your life. It\'s a 15-minute ritual, not a lifestyle change.',
  },
  {
    q: 'When does it launch?',
    a: 'We\'re in private alpha testing now. Join the waitlist and you\'ll be among the first to get access.',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="section-padding bg-plot-bg" aria-labelledby="faq-headline">
      <div className="content-wrapper max-w-prose">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10"
        >
          <motion.p variants={staggerItem} className="section-label">
            FAQ
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="faq-headline"
            className="section-headline"
          >
            Common questions
          </motion.h2>

          <motion.div variants={staggerItem} className="space-y-0">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b border-plot-border"
              >
                <button
                  onClick={() => toggle(i)}
                  className="
                    w-full flex items-center justify-between
                    py-5 md:py-6 text-left
                    group cursor-pointer
                  "
                  aria-expanded={openIndex === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="
                    font-heading text-base md:text-lg
                    text-plot-text uppercase tracking-wider
                    pr-4
                    group-hover:text-plot-accent transition-colors
                  ">
                    {faq.q}
                  </span>

                  {/* +/− indicator */}
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="
                      text-plot-accent text-2xl font-light
                      shrink-0 leading-none select-none
                    "
                    aria-hidden="true"
                  >
                    +
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="
                        font-body text-base text-plot-muted
                        leading-relaxed pb-6
                        max-w-[95%]
                      ">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA SECTION
   ============================================================ */

function FinalCTA() {
  return (
    <section className="section-padding bg-plot-surface" aria-labelledby="cta-headline">
      <div className="content-wrapper text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-6 flex flex-col items-center"
        >
          <motion.h2
            variants={staggerItem}
            id="cta-headline"
            className="section-headline"
          >
            Ready to PLOT your future?
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow"
          >
            Join the waitlist. Alpha testing now happening. Sign-up to get involved.
          </motion.p>

          <motion.div variants={staggerItem} className="w-full flex justify-center mt-2">
            <MailerLiteForm variant="footer" id="footer-form" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   FOOTER
   ============================================================ */

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="py-10 md:py-14 bg-plot-bg border-t border-plot-border"
      role="contentinfo"
    >
      <div className="content-wrapper">
        <div className="
          flex flex-col md:flex-row items-start md:items-center
          justify-between gap-8
        ">
          {/* Left: Logo + tagline */}
          <div className="space-y-2">
            <span className="
              font-display font-bold text-xl text-plot-accent
              tracking-[0.25em]
            ">
              PLOT
            </span>
            <p className="font-body text-sm text-plot-muted">
              Household budgeting for couples.
            </p>
          </div>

          {/* Center: Links */}
          <nav aria-label="Footer navigation" className="flex gap-6 flex-wrap">
            {[
              { label: 'Log in', href: 'https://app.plotbudget.com/login' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Contact', href: 'mailto:hello@plotbudget.com' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="
                  font-heading text-label-sm uppercase tracking-wider
                  text-plot-muted hover:text-plot-accent
                  transition-colors
                "
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Email */}
          <a
            href="mailto:hello@plotbudget.com"
            className="
              font-heading text-label-sm text-plot-muted
              hover:text-plot-accent transition-colors
              tracking-wider
            "
          >
            hello@plotbudget.com
          </a>
        </div>

        {/* Copyright */}
        <p className="
          mt-8 pt-6 border-t border-plot-border
          font-heading text-label-sm text-plot-muted/50
          tracking-wider uppercase text-center md:text-left
        ">
          © {year} Allotment Technology Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
