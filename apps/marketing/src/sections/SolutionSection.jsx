import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const steps = [
  {
    num: '01',
    title: 'Set your blueprint',
    body: 'Add your household bills, savings goals, and debt repayments. Allocate them however you like — 50/50, 60/40, or any ratio that works for your household. Money first. Tasks, meals, and everything else follow as modules unlock.',
  },
  {
    num: '02',
    title: 'Run the ritual',
    body: 'Every payday, both of you open PLOT. Review the plan together. 20 minutes. Done.',
  },
  {
    num: '03',
    title: 'Live your month',
    body: 'Your household is organised. Neither of you is managing it alone. Get on with your life.',
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
            THE SOLUTION
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="solution-headline"
            className="section-headline"
          >
            Household OS — starting with money
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow"
          >
            Money is live now. Tasks, Calendar, Meals, Holidays, Vault, and Home Maintenance ship by end of March 2026. One system, built over time.
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
                    text-plot-accent-text opacity-20
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
