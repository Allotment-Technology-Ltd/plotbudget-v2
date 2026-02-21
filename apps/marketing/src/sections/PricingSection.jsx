import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/animationUtils';
import { APP_URL, PRICING_ENABLED } from '../lib/config';

const pricingTiers = [
  {
    id: 'free',
    name: 'Free tier',
    tagline: 'Forever',
    description: 'Core budgeting and shared finances. No time limit. No card required.',
    limits: [
      'Blueprint & Payday Ritual',
      'Shared visibility with your household',
      'Bills, wants, savings, repayments',
      'Generous limits for real-world use',
    ],
    cta: 'Included for everyone',
    price: null,
    ctaLink: null,
  },
  {
    id: 'founding',
    name: 'Founding Member',
    tagline: 'First 100 households',
    description: 'Full access to every module, free for 12 months. A thank-you for your early trust.',
    limits: [
      'Everything in Free, plus',
      'Unlimited pots and full feature set',
      'All modules as they ship (Tasks, Meals, Holidays, etc.)',
      'No payment required for 12 months',
    ],
    cta: 'Join as Founding Member',
    price: 'Free for 12 months',
    priceSecondary: null,
    ctaLink: `${APP_URL}/signup`,
    highlighted: true,
  },
  {
    id: 'pwyl',
    name: 'Pay What You Like',
    tagline: 'Optional',
    description: 'After your 2-cycle trial, the free tier is yours for good. PWYL contributions unlock the full suite — holidays, home, meals, and more.',
    limits: [
      '2 full Payday Rituals trial, no card',
      'Then permanent free tier',
      'Optional contribution unlocks all modules',
      'You set the amount; no mandatory subscription',
    ],
    cta: 'Start with 2-cycle trial',
    price: null,
    priceSecondary: null,
    ctaLink: `${APP_URL}/signup`,
    highlighted: false,
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
            PLOT is free to use, forever, on a Pay What You Like basis — no mandatory subscription. The first 100 households are Founding Members and get full access free for 12 months. Everyone else gets a 2-cycle trial, then a permanent free tier. PWYL unlocks the full suite.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 md:grid-cols-3 md:gap-8 max-w-4xl mx-auto"
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
                  First 100
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
          No mandatory subscription. Pay What You Like is optional and set by you inside the app.
        </motion.p>
      </div>
    </section>
  );
}
