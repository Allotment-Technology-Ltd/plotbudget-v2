import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';
import { APP_URL, PRICING_ENABLED } from '../lib/config';

const pricingTiers = [
  {
    id: 'trial',
    name: 'Trial',
    tagline: 'Your first 2 pay cycles',
    description: 'Try the full experience with unlimited bills and wants so you can set up your budget and run your first rituals.',
    limits: [
      'Unlimited bills & essentials (Needs)',
      'Unlimited discretionary items (Wants)',
      '5 savings pots',
      '5 repayments',
    ],
    cta: 'Included when you start',
    price: null,
    ctaLink: null,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Unlimited pots',
    description: 'No limits. Add as many bills, wants, savings goals, and repayments as you need. One price for the whole household.',
    limits: [
      'Unlimited Needs',
      'Unlimited Wants',
      'Unlimited savings pots',
      'Unlimited repayments',
    ],
    cta: 'Start free trial',
    price: '£4.99/month',
    priceSecondary: 'or £49.99/year (save 2 months)',
    ctaLink: `${APP_URL}/signup`,
    highlighted: true,
  },
];

export default function PricingSection() {
  if (!PRICING_ENABLED) return null;

  return (
    <section
      id="pricing"
      className="section-padding bg-plot-bg scroll-mt-20"
      aria-labelledby="pricing-headline"
    >
      <div className="content-wrapper">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-10 mb-12"
        >
          <motion.p variants={staggerItem} className="section-label">
            Pricing
          </motion.p>
          <motion.h2
            variants={staggerItem}
            id="pricing-headline"
            className="section-headline"
          >
            Simple, honest pricing
          </motion.h2>
          <motion.p
            variants={staggerItem}
            className="font-body text-lg text-plot-muted max-w-narrow mx-auto text-center"
          >
            Start with a free trial. Upgrade to Premium when you want unlimited pots and no limits.
          </motion.p>
          <motion.div
            variants={staggerItem}
            className="rounded-lg border border-plot-accent/30 bg-plot-accent/5 px-4 py-3 text-center max-w-xl mx-auto"
          >
            <p className="font-heading text-label-sm uppercase tracking-wider text-plot-accent-text">
              Launch offer: first 100 users get 12 months of Premium free
            </p>
            <p className="mt-1 text-sm text-plot-muted">
              Sign up now to lock in Founding Member status — unlimited pots for 12 months, on us.
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-2xl mx-auto"
        >
          {pricingTiers.map((tier) => (
            <motion.div
              key={tier.id}
              variants={staggerItem}
              className={`
                relative flex flex-col rounded-lg border bg-plot-surface p-6 md:p-8
                text-left transition-shadow hover:shadow-glow-sm
                ${tier.highlighted ? 'border-plot-accent ring-2 ring-plot-accent/20' : 'border-plot-border'}
              `}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-plot-accent px-3 py-0.5 text-xs font-medium text-on-accent tracking-wider">
                  Most flexible
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-heading text-lg uppercase tracking-wider text-plot-text">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-plot-muted">{tier.tagline}</p>
                {tier.price && (
                  <p className="mt-3 font-heading text-2xl text-plot-accent-text tracking-wide">
                    {tier.price}
                  </p>
                )}
                {tier.priceSecondary && (
                  <p className="mt-1 text-sm text-plot-muted">{tier.priceSecondary}</p>
                )}
              </div>
              <p className="mb-6 text-sm text-plot-muted">{tier.description}</p>
              <ul className="mb-6 space-y-3 flex-1">
                {tier.limits.map((limit) => (
                  <li key={limit} className="flex items-start gap-2 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-plot-accent-text"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-plot-text">{limit}</span>
                  </li>
                ))}
              </ul>
              {tier.ctaLink ? (
                <a
                  href={tier.ctaLink}
                  className="btn-primary inline-flex justify-center py-3 w-full font-heading text-cta-sm uppercase tracking-widest"
                >
                  {tier.cta}
                </a>
              ) : (
                <p className="text-sm text-plot-muted">{tier.cta}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          variants={staggerItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-plot-muted"
        >
          Payment is only taken after you sign up and choose to upgrade, inside the app.
        </motion.p>
      </div>
    </section>
  );
}
