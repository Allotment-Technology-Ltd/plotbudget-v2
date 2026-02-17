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
import AppShowcasePhone from './components/AppShowcasePhone';
import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';

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

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.plotbudget.com';

/* ============================================================
   APP ROOT
   ============================================================ */

export default function App() {
  const { theme, isDark, toggle } = useTheme();

  return (
    <>
      <SEO />
      <Navbar theme={theme} onToggleTheme={toggle} pricingEnabled={PRICING_ENABLED} />

      <main id="main-content">
        <Hero />
        <SocialProofStrip />
        <ProblemSection />
        <SolutionSection />
        <AppShowcase />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>

      <Footer pricingEnabled={PRICING_ENABLED} appUrl={APP_URL} />
      <CookieConsent />
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
          Budgeting for households. Privacy by default.
        </motion.p>

        {/* Headline with terminal typing effect */}
        <TerminalHeadline text="PLOT YOUR FUTURE" />

        {/* Subheadline */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.8}
          className="font-body text-lg md:text-xl text-plot-muted max-w-narrow"
        >
          The 20-minute payday ritual that replaces every awkward money
          conversation — without sharing bank access.
        </motion.p>

        {/* First 50 free + primary CTA */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.9}
          className="font-heading text-label-sm md:text-label uppercase tracking-wider text-plot-accent"
        >
          Free for the first 50 users — sign up to claim your spot.
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
            aria-label="Get the app"
          >
            Get the app
          </a>
          <p className="font-body text-sm text-plot-muted">Or get product updates by email</p>
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
        Built for UK couples who budget with spreadsheets — and for anyone who wants to plan their household finances, with or without a partner.
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
    body: 'Add your household bills, savings goals, and debt repayments. Allocate them however you like — 50/50, 60/40, or any ratio that works for your household.',
  },
  {
    num: '02',
    title: 'Run the ritual',
    body: 'On payday, open PLOT. Review your allocations. Check off bills. Adjust anything that\'s changed. 20 minutes, done.',
  },
  {
    num: '03',
    title: 'Live your month',
    body: 'Your needs are covered. Your savings are growing. Your debt is shrinking. You can see exactly where things stand — without a single awkward conversation about money.',
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
            Your 20-minute payday ritual
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow"
          >
            Once a month, on payday, sit down. Allocate your income.
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
          {/* Dark mode phone — video or static preview */}
          <motion.div
            style={{ y: yLeft }}
            className="phone-frame shadow-glow md:-rotate-3"
          >
            <div className="phone-screen phone-screen-dark">
              <AppShowcasePhone variant="dark" />
            </div>
          </motion.div>

          {/* Light mode phone — video or static preview */}
          <motion.div
            style={{ y: yRight }}
            className="phone-frame shadow-glow md:rotate-3"
          >
            <div className="phone-screen phone-screen-light">
              <AppShowcasePhone variant="light" />
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
    title: 'Built for one or two',
    body: 'PLOT works for solo use or with a partner. Invite someone to join your household anytime — or not. Designed for shared budgets with individual visibility when you do share. Together, not merged.',
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
   PRICING SECTION — Tier matrix (matches app pricing)
   Gate with VITE_PRICING_ENABLED so marketing stays in sync with app pricing flag.
   ============================================================ */

const PRICING_ENABLED = import.meta.env.VITE_PRICING_ENABLED === 'true';

const pricingTiers = [
  {
    id: 'trial',
    name: 'Trial',
    tagline: 'Your first 2 pay cycles',
    description: 'Try the full experience with unlimited bills and wants so you can set up your budget and run your first rituals.',
    limits: [
      'Unlimited bills & essentials (Needs)',
      'Unlimited discretionary items (Wants)',
      '5 savings pots',
      '5 repayments',
    ],
    cta: 'Included when you start',
    price: null,
    ctaLink: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Unlimited pots',
    description: 'No limits. Add as many bills, wants, savings goals, and repayments as you need. One price for the whole household.',
    limits: [
      'Unlimited Needs',
      'Unlimited Wants',
      'Unlimited savings pots',
      'Unlimited repayments',
    ],
    cta: 'Start free trial',
    price: '£4.99/month',
    priceSecondary: 'or £49.99/year (save 2 months)',
    ctaLink: `${APP_URL}/signup`,
    highlighted: true,
  },
];

function PricingSection() {
  if (!PRICING_ENABLED) return null;

  return (
    <section
      id="pricing"
      className="section-padding bg-plot-bg scroll-mt-20"
      aria-labelledby="pricing-headline"
    >
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10 mb-12"
        >
          <motion.p variants={staggerItem} className="section-label">
            Pricing
          </motion.p>
          <motion.h2
            variants={staggerItem}
            id="pricing-headline"
            className="section-headline"
          >
            Simple, honest pricing
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow mx-auto text-center"
          >
            Start with a free trial. Upgrade to Premium when you want unlimited pots and no limits.
          </motion.p>
          {/* Founding member hook: first 50 get 6 months free */}
          <motion.div
            variants={staggerItem}
            className="rounded-lg border border-plot-accent/30 bg-plot-accent/5 px-4 py-3 text-center max-w-xl mx-auto"
          >
            <p className="font-heading text-label-sm uppercase tracking-wider text-plot-accent">
              Launch offer: first 50 users get 6 months of Premium free
            </p>
            <p className="mt-1 text-sm text-plot-muted">
              Sign up now to lock in Founding Member status — unlimited pots for 6 months, on us.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-2xl mx-auto"
        >
          {pricingTiers.map((tier, i) => (
            <motion.div
              key={tier.id}
              variants={staggerItem}
              className={`
                relative flex flex-col rounded-lg border bg-plot-surface p-6 md:p-8
                text-left transition-shadow hover:shadow-glow-sm
                ${tier.highlighted ? 'border-plot-accent ring-2 ring-plot-accent/20' : 'border-plot-border'}
              `}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-plot-accent px-3 py-0.5 text-xs font-medium text-[#111] tracking-wider">
                  Most flexible
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-heading text-lg uppercase tracking-wider text-plot-text">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-plot-muted">{tier.tagline}</p>
                {tier.price && (
                  <p className="mt-3 font-heading text-2xl text-plot-accent tracking-wide">
                    {tier.price}
                  </p>
                )}
                {tier.priceSecondary && (
                  <p className="mt-1 text-sm text-plot-muted">{tier.priceSecondary}</p>
                )}
              </div>
              <p className="mb-6 text-sm text-plot-muted">{tier.description}</p>
              <ul className="mb-6 space-y-3 flex-1">
                {tier.limits.map((limit) => (
                  <li key={limit} className="flex items-start gap-2 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-plot-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-plot-text">{limit}</span>
                  </li>
                ))}
              </ul>
              {tier.ctaLink ? (
                <a
                  href={tier.ctaLink}
                  className="btn-primary inline-flex justify-center py-3 w-full font-heading text-cta-sm uppercase tracking-widest"
                >
                  {tier.cta}
                </a>
              ) : (
                <p className="text-sm text-plot-muted">{tier.cta}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          variants={staggerItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-plot-muted"
        >
          Payment is only taken after you sign up and choose to upgrade, inside the app.
        </motion.p>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ SECTION — Accordion
   ============================================================ */

const faqs = [
  {
    q: 'How does PLOT pricing work?',
    a: 'PLOT starts with a free trial for your first two pay cycles. The first 50 users get 6 months of Premium free as Founding Members — sign up early to lock it in.',
  },
  {
    q: 'Do I need to connect my bank account?',
    a: 'Never. PLOT is privacy-first. You enter your income and bills manually — which is actually faster than you\'d think, because you only do it once and PLOT remembers everything for next month.',
  },
  {
    q: 'Can I use PLOT on my own?',
    a: 'Yes. PLOT works for solo use or with a partner. You can invite someone to join your household anytime — or not. It\'s your choice.',
  },
  {
    q: 'What if my partner doesn\'t want to use it?',
    a: 'PLOT works brilliantly for solo use. If you have a partner, you can invite them anytime — and when they see how simple it makes everything, they may want in.',
  },
  {
    q: 'Is this just another budgeting app?',
    a: 'Most budgeting apps want you to track every coffee. PLOT doesn\'t. We believe in allocating your money on payday and then getting on with your life. It\'s a 20-minute ritual, not a lifestyle change.',
  },
  {
    q: 'When does it launch?',
    a: 'The app is live now. The first 50 users get free access — sign up to claim your spot.',
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
            Free for the first 50 users. Sign up now to start plotting your budget.
          </motion.p>

          <motion.div variants={staggerItem} className="w-full flex flex-col items-center gap-4 mt-2">
            <a
              href={APP_URL}
              className="btn-primary text-cta-sm px-8 py-3 font-heading uppercase tracking-widest"
              aria-label="Get the app"
            >
              Get the app
            </a>
            <p className="font-body text-sm text-plot-muted">Or get product updates by email</p>
            <MailerLiteForm variant="footer" id="footer-form" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

