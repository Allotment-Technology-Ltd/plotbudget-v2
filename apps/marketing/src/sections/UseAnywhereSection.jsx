import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

/**
 * Dedicated section: app on all devices, with copy about using PLOT
 * anywhere, anytime. Composed layout (desktop prominent, tablet + phone).
 */
const DEVICES = [
  {
    type: 'desktop',
    src: '/showcase/dashboard-desktop.png',
    alt: 'PLOT on desktop: dashboard with income, upcoming bills, and recent activity.',
    className: 'device-frame-desktop w-full min-w-0 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto',
  },
  {
    type: 'tablet',
    src: '/showcase/blueprint-desktop.png',
    alt: 'PLOT on tablet: Blueprint with category allocation and joint set-aside.',
    className: 'device-frame-tablet w-full max-w-[340px] lg:max-w-[400px]',
  },
  {
    type: 'phone',
    src: '/screenshots/dashboard-overview.png',
    alt: 'PLOT on phone: dashboard overview.',
    className: 'phone-frame shadow-glow w-[200px] sm:w-[220px] lg:w-[240px]',
  },
];

function DeviceFrame({ device, index }) {
  const isPhone = device.type === 'phone';
  const isTablet = device.type === 'tablet';
  const isDesktop = device.type === 'desktop';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.12 }}
      className="flex justify-center"
    >
      {isDesktop && (
        <div className={device.className}>
          <div className="device-frame-desktop__chrome">
            <div className="device-frame-desktop__chrome-dots" aria-hidden>
              <span /><span /><span />
            </div>
            <span className="device-frame-desktop__chrome-url">app.plotbudget.com</span>
          </div>
          <div className="device-frame-desktop__content">
            <img
              src={device.src}
              alt={device.alt}
              className="device-frame-desktop__img"
            />
          </div>
        </div>
      )}
      {isTablet && (
        <div className={device.className}>
          <div className="device-frame-tablet__screen">
            <img
              src={device.src}
              alt={device.alt}
              className="device-frame-tablet__img"
            />
          </div>
        </div>
      )}
      {isPhone && (
        <div className={device.className}>
          <div className="phone-screen phone-screen-dark phone-screen--short">
            <img src={device.src} alt={device.alt} className="w-full block" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function UseAnywhereSection() {
  return (
    <section
      className="section-padding bg-plot-bg border-y border-plot-border"
      aria-labelledby="use-anywhere-headline"
    >
      <div className="content-wrapper">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-6 lg:col-span-4 order-2 lg:order-1"
          >
            <motion.p variants={staggerItem} className="section-label">
              Any device
            </motion.p>
            <motion.h2
              variants={staggerItem}
              id="use-anywhere-headline"
              className="section-headline"
            >
              Your budget, wherever you are
            </motion.h2>
            <motion.p variants={staggerItem} className="text-plot-muted text-lg leading-relaxed">
              One account. Sign in on your phone, tablet, or computer—at the kitchen table, on the sofa, or at your desk. Use PLOT whenever and wherever it fits your schedule, not the other way around.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-8 order-1 lg:order-2 min-w-0"
          >
            <div className="flex flex-col items-center gap-8 lg:gap-10">
              <DeviceFrame device={DEVICES[0]} index={0} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10 items-end justify-items-center w-full max-w-2xl mx-auto">
                <DeviceFrame device={DEVICES[1]} index={1} />
                <DeviceFrame device={DEVICES[2]} index={2} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
