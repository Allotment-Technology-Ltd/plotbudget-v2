import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const faqs = [
  {
    q: 'How does PLOT pricing work?',
    a: 'PLOT starts with a free trial for your first two pay cycles. The first 100 users get 12 months of Premium free as Founding Members — sign up early to lock it in.',
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
    a: 'The app is live now. The first 100 users get free access — sign up to claim your spot.',
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
