import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const problems = [
  {
    label: 'THE PROBLEM',
    title: 'The mental load is invisible — until it breaks something.',
    body: 'One person tracks the bills, plans the meals, books the repairs, and remembers the insurance renewal. The other person asks. Neither wanted it this way.',
  },
  {
    label: 'THE PATTERN',
    title: 'Six apps, three spreadsheets, forty-seven sticky notes.',
    body: 'Households are complex systems managed with consumer tools built for individuals. Something always falls through the cracks.',
  },
  {
    label: 'THE COST',
    title: 'Time, autonomy, and the feeling that you\'re both on the same team.',
    body: 'When household management defaults to one person, it creates dependency, resentment, and exhaustion. Slowly. Quietly.',
  },
];

export default function ProblemSection() {
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
            THE PROBLEM
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="problem-headline"
            className="section-headline max-w-prose"
          >
            One person shouldn&apos;t have to run the whole household.
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
                <p className="font-heading text-label-sm uppercase tracking-[0.15em] text-plot-accent-text mb-3">
                  {p.label}
                </p>
                <h3 className="
                  font-heading text-sub-sm uppercase tracking-wider
                  text-plot-text mb-4
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
