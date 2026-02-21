import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const faqs = [
  {
    q: 'Is PLOT just for couples?',
    a: 'No. PLOT works for solo households, couples, and anyone managing a home. The partner features are optional — add them when you\'re ready.',
  },
  {
    q: 'Why won\'t you connect to my bank?',
    a: 'Because your transaction data is worth money to companies that harvest it. We don\'t want it. Manual input takes five extra minutes and keeps your data yours. That\'s a trade worth making.',
  },
  {
    q: 'What\'s actually available now?',
    a: 'The Money module is fully live — budget planning, bill tracking, shared visibility, the Payday Ritual. Tasks, Calendar, Meals, Holidays, Vault, and Home Maintenance arrive by end of March 2026.',
  },
  {
    q: 'What does "pay what you like" actually mean?',
    a: 'PLOT is free to use, forever — there\'s no mandatory subscription. The first 100 households to join are Founding Members and get full access free for 12 months. After that, new households get a 2-cycle trial (two full Payday Rituals), all features, no card required. Then you’re on a permanent free tier: core budgeting and shared finances stay free forever. Optional PWYL contributions unlock the full suite (holidays, home, meals, and more).',
  },
  {
    q: 'Is my data safe?',
    a: 'Your data lives in Supabase (enterprise-grade Postgres) with Row Level Security on every table. We don\'t sell it, share it, or analyse it for advertising. Full details in our privacy policy.',
  },
];

export default function FAQSection() {
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
                    group-hover:text-plot-accent-text transition-colors
                  ">
                    {faq.q}
                  </span>

                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="
                      text-plot-accent-text text-2xl font-light
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
