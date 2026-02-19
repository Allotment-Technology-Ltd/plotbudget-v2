import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';
import { APP_URL } from '../lib/config';

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
            Free for the first 100 users. Sign up now to start plotting your budget.
          </motion.p>

          <motion.div variants={staggerItem} className="w-full flex flex-col items-center gap-4 mt-2">
            <a
              href={APP_URL}
              className="btn-primary text-cta-sm px-8 py-3 font-heading uppercase tracking-widest"
              aria-label="Get the app"
            >
              Get the app
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
