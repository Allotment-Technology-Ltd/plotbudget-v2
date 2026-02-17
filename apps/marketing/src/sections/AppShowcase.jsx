import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';
import AppShowcasePhone from '../components/AppShowcasePhone';

export default function AppShowcase() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const yLeft = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const yRight = useTransform(scrollYProgress, [0, 1], [100, -40]);

  return (
    <section
      ref={sectionRef}
      className="section-padding bg-plot-bg overflow-hidden"
      aria-labelledby="showcase-headline"
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
            The App
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="showcase-headline"
            className="section-headline"
          >
            Two themes. One clear view.
          </motion.h2>
        </motion.div>

        <div className="
          flex flex-col md:flex-row items-center justify-center
          gap-8 md:gap-12 mt-12 md:mt-16
        ">
          <motion.div
            style={{ y: yLeft }}
            className="phone-frame shadow-glow md:-rotate-3"
          >
            <div className="phone-screen phone-screen-dark">
              <AppShowcasePhone variant="dark" />
            </div>
          </motion.div>

          <motion.div
            style={{ y: yRight }}
            className="phone-frame shadow-glow md:rotate-3"
          >
            <div className="phone-screen phone-screen-light">
              <AppShowcasePhone variant="light" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
