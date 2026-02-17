import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

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
