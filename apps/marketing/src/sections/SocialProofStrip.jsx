import { motion } from 'framer-motion';

export default function SocialProofStrip() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="bg-plot-overlay py-5 md:py-6 border-y border-plot-border"
      aria-label="Social proof"
    >
      <p className="
        text-center font-heading text-label-sm md:text-label
        uppercase tracking-[0.15em] text-plot-accent-text
        content-wrapper
      ">
        Built for couples who budget with spreadsheets — and for anyone who wants to plan their household finances, with or without a partner.
      </p>
    </motion.section>
  );
}
