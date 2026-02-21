import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const SHOWCASE_SCREENS = [
  {
    src: '/screenshots/dashboard-overview.png',
    alt: 'PLOT Dashboard showing allocated budget, left to spend, days left, and financial health score.',
    tagline: 'Your financial overview at a glance.',
  },
  {
    src: '/screenshots/blueprint.png',
    alt: 'PLOT Blueprint with cycle dates, total allocated, income, and needs vs wants split.',
    tagline: 'Plan your cycle. One ritual, done.',
  },
  {
    src: '/screenshots/dashboard-categories.png',
    alt: 'Budget categories — Needs, Wants, Savings, Repay — plus upcoming bills and savings & debt.',
    tagline: 'Needs, wants, savings — clearly split.',
  },
];

function PhoneFrame({ screen, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.32) }}
      className="phone-frame shadow-glow flex-shrink-0 w-[260px] md:w-[280px]"
    >
      <div className="phone-screen phone-screen-dark phone-screen--short">
        <img
          src={screen.src}
          alt={screen.alt}
          className="w-full block"
          loading={index < 3 ? 'eager' : 'lazy'}
        />
      </div>
      <p className="mt-4 font-heading text-label-sm uppercase tracking-wider text-plot-accent-text text-center max-w-[240px] mx-auto">
        {screen.tagline}
      </p>
    </motion.div>
  );
}

export default function AppShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const yLeft = useTransform(scrollYProgress, [0, 0.4], [30, -20]);
  const yRight = useTransform(scrollYProgress, [0.15, 0.55], [20, -25]);

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
            THE APP
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="showcase-headline"
            className="section-headline"
          >
            One system. Your whole household.
          </motion.h2>

          <motion.p variants={staggerItem} className="text-plot-muted text-lg max-w-2xl">
            The Money module is live now. Tasks, Calendar, Meals, Holidays, Vault, and Home Maintenance arrive by end of March 2026. One place. No subscriptions to six separate apps.
          </motion.p>
        </motion.div>

        {/* Module preview strip — enabled = mint, coming soon = muted */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-4 md:gap-6"
          aria-label="Module status"
        >
          {[
            { name: 'Money', enabled: true },
            { name: 'Tasks', enabled: false },
            { name: 'Calendar', enabled: false },
            { name: 'Meals', enabled: false },
            { name: 'Holidays', enabled: false },
            { name: 'Vault', enabled: false },
            { name: 'Home', enabled: false },
          ].map((mod, i) => (
            <motion.div
              key={mod.name}
              variants={staggerItem}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="font-heading text-label-sm uppercase tracking-wider"
                style={{
                  color: mod.enabled ? '#69F0AE' : '#444444',
                }}
              >
                {mod.name}
              </span>
              {!mod.enabled && (
                <span className="font-body text-xs uppercase tracking-wider" style={{ color: '#444444' }}>
                  Coming soon
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>

        <div
          className="mt-12 md:mt-16 overflow-x-auto overflow-y-visible scroll-smooth pb-4 md:pb-0"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="flex gap-8 md:gap-10 justify-start md:justify-center min-w-max md:min-w-0 md:flex-wrap px-2 md:px-0">
            {SHOWCASE_SCREENS.map((screen, i) => (
              <motion.div
                key={screen.src}
                className="flex flex-col items-center"
                style={
                  i === 0 ? { y: yLeft } : i === 1 ? { y: yRight } : undefined
                }
              >
                <PhoneFrame screen={screen} index={i} />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            to="/features"
            className="
              font-heading text-cta-sm uppercase tracking-[0.2em]
              text-plot-accent-text hover:text-plot-accent border-b-2 border-plot-accent hover:border-plot-accent-text
              transition-colors duration-200
              focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2
            "
          >
            See all features →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
