import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

/**
 * Showcase cards: charts and key functionality, no phone frame.
 * Best-in-class: clear benefit headline, one-line copy, appealing image.
 */
const SHOWCASE_ITEMS = [
  {
    id: 'payoff-trajectory',
    image: '/showcase/payoff-trajectory.png',
    title: 'Payoff trajectory',
    copy: 'See when you’ll be debt-free. Projections based on your locked-in amounts.',
    href: '/features#forecasts',
  },
  {
    id: 'savings-forecast',
    image: '/showcase/savings-forecast.png',
    title: 'Savings forecast',
    copy: 'Set a target date and see how much to save per cycle — or enter an amount and get the date.',
    href: '/features#forecasts',
  },
  {
    id: 'category-allocation',
    image: '/showcase/category-allocation.png',
    title: 'Category allocation',
    copy: 'Needs, wants, savings and repay — with progress bars and over-budget alerts.',
    href: '/features#categories',
  },
  {
    id: 'couple-contributions',
    image: '/showcase/couple-contributions.png',
    title: 'Couple contributions',
    copy: 'Who’s contributing what. Joint transfer and set-aside at a glance.',
    href: '/features#couple',
  },
  {
    id: 'savings-debt',
    image: '/showcase/savings-debt-progress.png',
    title: 'Savings & debt progress',
    copy: 'Goals and repayments in one place. Progress bars and manage links.',
    href: '/features#categories',
  },
  {
    id: 'recent-activity',
    image: '/showcase/recent-activity.png',
    title: 'Recent activity',
    copy: 'Your household’s latest moves. Created, edited, added — with timestamps.',
    href: '/features',
  },
];

export default function ChartsAndFeaturesSection() {
  return (
    <section
      className="section-padding bg-plot-surface border-y border-plot-border"
      aria-labelledby="charts-features-headline"
    >
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10 mb-12 md:mb-16"
        >
          <motion.p variants={staggerItem} className="section-label">
            See it in action
          </motion.p>
          <motion.h2
            variants={staggerItem}
            id="charts-features-headline"
            className="section-headline max-w-2xl"
          >
            Charts and key features
          </motion.h2>
          <motion.p variants={staggerItem} className="text-plot-muted text-lg max-w-2xl">
            Projections, category splits, couple contributions, and activity — no mobile frame, just the app as you use it.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {SHOWCASE_ITEMS.map((item) => (
            <motion.div key={item.id} variants={staggerItem}>
              <Link
                to={item.href}
                className="
                  group block bg-plot-bg border border-plot-border overflow-hidden
                  transition-all duration-200
                  hover:border-plot-accent/40 hover:shadow-[0_0_24px_var(--accent-glow)]
                  focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plot-surface
                "
                style={{ borderRadius: 0 }}
              >
                <div className="overflow-hidden bg-plot-elevated min-h-[200px]">
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-auto min-h-[200px] object-contain object-top transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="font-heading text-sub-sm md:text-sub font-bold uppercase tracking-wider text-plot-text group-hover:text-plot-accent-text transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-plot-muted leading-relaxed">
                    {item.copy}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            to="/features"
            className="font-heading text-label-sm uppercase tracking-wider text-plot-accent-text hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 rounded-sm"
          >
            Explore all features →
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
