import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

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
    body: 'No bank connections. No transaction data. No behavioural tracking. You enter the numbers. You own everything. We earn from optional Pay What You Like contributions, not your data.',
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
    body: 'Use PLOT solo or invite your partner. Both of you have full visibility, full control. No one person holds the keys.',
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
    title: 'Rituals, not routines',
    body: 'A 20-minute Payday Ritual. A 10-minute Weekly Reset. A monthly Meal Plan. Designed around natural household rhythms — not daily check-ins that steal your attention.',
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
    body: 'Separate accounts, joint bills, shared goals. PLOT works with how you actually live — not how a financial app thinks you should.',
  },
];

export default function FeaturesSection() {
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
            WHY PLOT
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="features-headline"
            className="section-headline"
          >
            One system for your whole household
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
                <div className="text-plot-accent-text mb-4" aria-hidden="true">
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
