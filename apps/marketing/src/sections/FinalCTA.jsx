import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';
import { APP_URL } from '../lib/config';

// TODO: Wire up to real founding-household count (e.g. API or server-injected value)
const FOUNDING_SPOTS_CLAIMED = 42;

export default function FinalCTA() {
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
          <motion.p variants={staggerItem} className="section-label">
            JOIN US
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="cta-headline"
            className="section-headline"
          >
            Run your household. Together.
          </motion.h2>

          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow"
          >
            PLOT is free to use, forever. The first 100 households are Founding Members — full access free for 12 months. Everyone else gets a 2-cycle trial, then a generous free tier. Pay What You Like unlocks the full suite.
          </motion.p>

          <motion.div variants={staggerItem} className="w-full flex flex-col items-center gap-4 mt-2">
            <a
              href={APP_URL}
              className="btn-primary text-cta-sm px-8 py-3 font-heading uppercase tracking-widest"
              aria-label="Join as a founding household"
            >
              Join as a founding household
            </a>
          </motion.div>

          <motion.p
            variants={staggerItem}
            className="font-heading text-label-sm uppercase tracking-wider text-plot-muted"
          >
            No bank connections required. No mandatory subscription. Currently {FOUNDING_SPOTS_CLAIMED} of 100 Founding Member spots claimed.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
