import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

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

export default function SolutionSection() {
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
