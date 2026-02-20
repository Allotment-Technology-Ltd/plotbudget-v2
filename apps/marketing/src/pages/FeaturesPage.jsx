import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../lib/animationUtils';

const FEATURES = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    subtitle: 'Your financial overview',
    image: '/screenshots/dashboard-overview.png',
    imageAlt: 'PLOT Dashboard: allocated budget, left to spend, days left, financial health.',
    body: 'See at a glance how much you’ve allocated, what’s left to spend, how many days remain in your cycle, and your financial health score. One screen. No digging.',
  },
  {
    id: 'blueprint',
    title: 'Blueprint',
    subtitle: 'Plan your payday cycle',
    image: '/screenshots/blueprint.png',
    imageAlt: 'PLOT Blueprint: cycle dates, total allocated, income, needs and wants.',
    body: 'Set your cycle dates and split income into needs and wants. See total allocated vs income, manage pay dates, and edit your split. The blueprint is your single source of truth for the month.',
  },
  {
    id: 'categories',
    title: 'Needs, Wants, Savings & Repay',
    subtitle: 'Charts that make sense',
    image: '/showcase/category-allocation.png',
    imageAlt: 'Category allocation: needs, wants, savings, repay with progress bars and over-budget alerts.',
    body: 'Track spending by category with clear progress bars and over-budget warnings. Upcoming bills sit in one list so you know what’s due. Savings goals and debt show current vs target with a single view.',
    showcaseImage: true,
  },
  {
    id: 'savings',
    title: 'Savings goals',
    subtitle: 'Set, track, accomplish',
    image: '/showcase/savings-forecast.png',
    imageAlt: 'Savings forecast: goal, target date, projection chart and outcome summary.',
    body: 'Name a goal, set an optional due date and target amount, and link it to a pot. See a projection chart and “use suggested” amount to hit your target date. Mark items as Saving, Accomplished, or Paused.',
    showcaseImage: true,
  },
  {
    id: 'income',
    title: 'Income sources',
    subtitle: 'Who gets what, when',
    image: '/screenshots/income-sources.png',
    imageAlt: 'Income: amount, frequency, day of month, who gets the income.',
    body: 'Add income with amount, frequency (specific date, last working day, or every 4 weeks), and who receives it — you, your partner, or joint. Your blueprint and dashboard use this so your numbers stay in sync.',
  },
  {
    id: 'forecasts',
    title: 'Forecasts & projections',
    subtitle: 'Debt payoff and savings on one timeline',
    image: '/showcase/repayment-forecast.png',
    imageAlt: 'Credit card repayment: outcome summary, projection chart, lock-in amount.',
    body: 'Set a target payoff date to get a suggested amount, or enter an amount to see when you’ll clear the debt. Projections show “your amount” vs “target-date plan” and total paid with interest. Same idea for savings: reach your goal by date or see when you’d get there at a given save rate.',
    showcaseImage: true,
  },
  {
    id: 'couple',
    title: 'Couple contributions',
    subtitle: 'Who’s contributing what',
    image: '/showcase/couple-contributions.png',
    imageAlt: 'Couple contributions: you and partner totals, joint transfer breakdown.',
    body: 'See each person’s contribution and the joint transfer total. No hidden numbers — both partners see the same view so household planning stays fair and visible.',
    showcaseImage: true,
  },
  {
    id: 'partner',
    title: 'Partner access',
    subtitle: 'Invite and share the plan',
    image: '/showcase/partner-access.png',
    imageAlt: 'Partner access: invitation pending, copy link or send email.',
    body: 'Invite your partner with a link or email. They join the same household and see the same blueprint and dashboard. Cancel or resend anytime. Built for two, without merging your identities.',
    showcaseImage: true,
  },
  {
    id: 'upcoming',
    title: 'Upcoming bills',
    subtitle: 'What’s due, in one list',
    image: '/showcase/upcoming-bills.png',
    imageAlt: 'Upcoming bills: gym, emergency fund, credit card, holiday fund, netflix with categories and amounts.',
    body: 'Bills, savings and repayments appear in a single list with category and amount. One place to see what’s due this cycle so nothing slips through.',
    showcaseImage: true,
  },
  {
    id: 'activity',
    title: 'Recent activity',
    subtitle: 'Your household’s latest moves',
    image: '/showcase/recent-activity.png',
    imageAlt: 'Recent activity feed: created, edited, added items with category and time.',
    body: 'A feed of what changed: created funds, edited items, added bills. Each line shows category, amount and “X minutes ago”. Quick visibility without digging into each module.',
    showcaseImage: true,
  },
];

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function FeaturesPage() {
  return (
    <>
      <Helmet>
        <title>Features — PLOT | Budgeting for Households</title>
        <meta
          name="description"
          content="Dashboard, Blueprint, forecasts, category allocation, couple contributions, partner access, upcoming bills and recent activity — see how PLOT helps you plan and track your household budget."
        />
      </Helmet>

      <main id="main-content" className="min-h-screen">
        <div className="content-wrapper section-padding">
          <motion.header
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mb-16 md:mb-20"
          >
            <motion.p variants={staggerItem} className="section-label">
              Features
            </motion.p>
            <motion.h1
              variants={staggerItem}
              className="text-3xl md:text-4xl font-display font-bold text-plot-text tracking-tight"
            >
              Every part of the app, in plain sight
            </motion.h1>
            <motion.p
              variants={staggerItem}
              className="mt-4 text-plot-muted text-lg"
            >
              Dashboard, Blueprint, categories, savings goals, and income — each module is built so you see your numbers and stay in control.
            </motion.p>
          </motion.header>

          <div className="space-y-20 md:space-y-28">
            {FEATURES.map((feature, i) => (
              <motion.section
                key={feature.id}
                id={feature.id}
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                className={`flex flex-col gap-10 md:gap-14 ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} md:items-center md:justify-between`}
              >
                <motion.div
                  variants={cardItem}
                  className={`flex-shrink-0 ${feature.showcaseImage ? 'md:w-full max-w-2xl' : 'md:w-[320px] lg:w-[360px]'}`}
                >
                  {feature.showcaseImage ? (
                    <div className="border border-plot-border overflow-hidden bg-plot-elevated shadow-glow">
                      <img
                        src={feature.image}
                        alt={feature.imageAlt}
                        className="w-full block"
                      />
                    </div>
                  ) : (
                    <div className="phone-frame shadow-glow w-[260px] md:w-[280px] mx-auto md:mx-0">
                      <div className="phone-screen phone-screen-dark phone-screen--short">
                        <img
                          src={feature.image}
                          alt={feature.imageAlt}
                          className="w-full block"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
                <motion.div variants={cardItem} className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-xl md:text-2xl text-plot-text uppercase tracking-wide">
                    {feature.title}
                  </h2>
                  <p className="mt-1 font-heading text-label-sm uppercase tracking-wider text-plot-accent-text">
                    {feature.subtitle}
                  </p>
                  <p className="mt-4 text-plot-muted leading-relaxed">
                    {feature.body}
                  </p>
                </motion.div>
              </motion.section>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 pt-16 border-t border-plot-border text-center"
          >
            <p className="font-heading text-label-sm uppercase tracking-wider text-plot-muted mb-4">
              Ready to try it?
            </p>
            <Link
              to="/"
              className="
                font-heading text-cta-sm uppercase tracking-[0.2em]
                bg-plot-accent text-on-accent px-6 py-3
                hover:shadow-[0_0_20px_var(--accent-glow)] hover:-translate-y-px
                transition-all duration-200 rounded-none inline-block
                focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2
              "
            >
              Back to home
            </Link>
          </motion.div>
        </div>
      </main>
    </>
  );
}
