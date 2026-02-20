import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { APP_URL } from '../lib/config';

/**
 * Stagger for principle cards: 100ms between each.
 */
const cardStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const principles = [
  {
    id: '01',
    title: 'The Sisyphean Condition',
    main: 'Life is repetitive. Bills need paying every month. Chores need doing every week. Meals need planning. Home maintenance never ends. The boulder always rolls back down the hill. Most apps promise to eliminate the boulder through automation or optimisation. But they can\'t. The boulder is life.',
    approach: 'Accept the boulder. Make pushing it bearable. Turn repetition into ritual.',
    quote: '20 minutes at payday. 10 minutes on Sunday. The rest of your time? Live your life.',
  },
  {
    id: '02',
    title: 'Household Labour is Real Work',
    main: 'Budgeting, meal planning, chore management, document tracking—this is real work. It takes time, attention, and energy. In most households, one person does most of this work invisibly. They manage the spreadsheet. They chase updates. They hold the mental load. This isn\'t just inefficient. It\'s unfair.',
    approach: 'Make household work visible. Distribute it equitably. No one should be the household chancellor.',
    quote: 'Households are teams, not hierarchies.',
  },
  {
    id: '03',
    title: 'Tools Should Serve, Not Surveil',
    main: 'Most budgeting apps want to connect to your bank. They harvest your transactions. They analyse your behaviour. Some sell this data. Others use it to shape your spending. This is surveillance capitalism—extracting value from your data without your meaningful consent.',
    approach: 'No bank connections. No transaction harvesting. No behavioural extraction. You enter the numbers. You make the decisions. You own the data.',
    quote: 'We\'re paid by subscription, not by your data. This changes everything.',
  },
  {
    id: '04',
    title: 'Autonomy Over Optimisation',
    main: 'Your household isn\'t an algorithm. Your values aren\'t data points. Software shouldn\'t decide for you—it should help you decide together.',
    approach: 'The tool helps. You decide. We give you structure, visibility, and shared control. The judgment is yours.',
    quote: 'Software is infrastructure, not a parent.',
  },
  {
    id: '05',
    title: 'Constraint as Kindness',
    main: 'When you have infinite options, decision-making becomes exhausting. When your budgeting app has 47 configuration screens, you spend more time setting it up than using it. Too much freedom is a burden.',
    approach: 'Make the hard decisions so you don\'t have to. One or two great ways to do each thing. Opinionated workflows refined through years of real use. Simple systems beat complex ones.',
    quote: 'We\'ve made the mistakes so you don\'t have to.',
  },
  {
    id: '06',
    title: 'Respect for Time',
    main: 'Most apps optimise for engagement. More notifications. More daily check-ins. More screen time. This is the attention economy—your time is the product being sold.',
    approach: 'We want 20 minutes of your month. Not your life. Get in, handle it, get out. Good tools disappear when you\'re not using them.',
    quote: 'The goal is to spend LESS time in PLOT, not more.',
  },
  {
    id: '07',
    title: 'Reality Over Aspiration',
    main: 'Most productivity apps sell transformation. \'Unlock your potential.\' \'Achieve your dreams.\' But household admin isn\'t aspirational. It\'s mundane. Bills, chores, groceries—this is life\'s unglamorous scaffolding.',
    approach: 'Honesty. We\'re not here to transform you. We\'re here to make the boring parts of life less painful so you have more time for what matters: love, connection, presence, meaning.',
    quote: 'Because managing your life shouldn\'t consume it.',
  },
  {
    id: '08',
    title: 'Built With, Not For',
    main: 'My partner has tested PLOT since day one. Founding members vote on what gets built next. This isn\'t my product. It\'s ours.',
    approach: 'Products built in isolation from their users serve the builder, not the user. We listen. We adapt. We build with you.',
    quote: 'The best tools emerge from conversation, not command.',
  },
];

const inPracticeItems = [
  { feature: 'No bank connections', principle: 'Surveillance capitalism rejection (Principle 3)' },
  { feature: '20-minute rituals', principle: 'Time respect (Principle 6)' },
  { feature: 'Fairness tracking', principle: 'Labour equity (Principle 2)' },
  { feature: 'Opinionated workflows', principle: 'Constraint as kindness (Principle 5)' },
  { feature: 'Pay-what-you-like founding members', principle: 'Built with users (Principle 8)' },
  { feature: 'Manual input', principle: 'Reality over automation fantasy (Principles 1, 7)' },
  { feature: 'Shared visibility', principle: 'No household hierarchies (Principle 2)' },
  { feature: 'You control the system', principle: 'User autonomy (Principle 4)' },
];

export default function PrinciplesPage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !reducedMotion;

  return (
    <>
      <Helmet>
        <title>Principles | PLOT</title>
        <meta
          name="description"
          content="The foundational beliefs that guide how we build PLOT—a household operating system designed for equity, privacy, and reality."
        />
        <meta property="og:title" content="Principles | PLOT" />
        <meta property="og:description" content="The foundational beliefs that guide how we build PLOT—a household operating system designed for equity, privacy, and reality." />
        <meta property="og:url" content="https://plotbudget.com/principles" />
        <meta name="twitter:title" content="Principles | PLOT" />
        <meta name="twitter:description" content="The foundational beliefs that guide how we build PLOT—a household operating system designed for equity, privacy, and reality." />
      </Helmet>

      <div className="min-h-screen bg-plot-bg">
        {/* Hero */}
        <section
          className="content-wrapper section-padding text-center"
          aria-labelledby="principles-title"
        >
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-prose mx-auto"
          >
            <h1
              id="principles-title"
              className="font-heading text-display-sm md:text-display-lg font-bold uppercase tracking-[0.08em] text-plot-text mb-6"
            >
              Principles
            </h1>
            <p className="font-body text-sub-sm md:text-sub text-plot-muted leading-relaxed">
              PLOT is built on beliefs about how households should work, how software should serve people, and what makes life liveable.
            </p>
          </motion.div>
        </section>

        {/* Principle cards */}
        <section
          className="content-wrapper section-padding"
          aria-label="Founding principles"
        >
          <div className="max-w-3xl mx-auto space-y-12 md:space-y-16">
            <motion.div
              variants={shouldAnimate ? cardStagger : {}}
              initial={shouldAnimate ? 'hidden' : false}
              whileInView={shouldAnimate ? 'visible' : {}}
              viewport={{ once: true, amount: 0.1 }}
              className="space-y-12 md:space-y-16"
            >
              {principles.map((p) => (
                <motion.article
                  key={p.id}
                  id={`principle-${p.id}`}
                  variants={shouldAnimate ? cardItem : {}}
                  className="card border border-plot-border bg-plot-surface"
                >
                  <span
                    className="inline-block font-heading text-label-sm uppercase tracking-widest text-plot-accent-text mb-4"
                    aria-hidden="true"
                  >
                    {p.id}
                  </span>
                  <h2 className="font-heading text-headline-sm md:text-sub font-bold uppercase tracking-[0.04em] text-plot-text mb-4">
                    {p.title}
                  </h2>
                  <p className="font-body text-plot-text leading-relaxed mb-6">
                    {p.main}
                  </p>
                  <p className="font-heading text-label-sm uppercase tracking-wider text-plot-accent-text mb-2">
                    PLOT&apos;s approach:
                  </p>
                  <p className="font-body text-plot-text leading-relaxed font-medium mb-6">
                    {p.approach}
                  </p>
                  <blockquote className="font-body text-sub-sm text-plot-muted italic border-l-2 border-plot-accent pl-4">
                    {p.quote}
                  </blockquote>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* In Practice */}
        <section
          id="in-practice"
          className="content-wrapper section-padding border-t border-plot-border"
          aria-labelledby="in-practice-title"
        >
          <div className="max-w-3xl mx-auto">
            <motion.h2
              id="in-practice-title"
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-heading text-headline-sm md:text-headline font-bold uppercase tracking-[0.08em] text-plot-text mb-4"
            >
              In Practice
            </motion.h2>
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-body text-plot-muted mb-8"
            >
              These aren&apos;t just words. They&apos;re encoded in every decision:
            </motion.p>
            <ul className="space-y-3 font-body text-plot-text" role="list">
              {inPracticeItems.map((item, i) => (
                <motion.li
                  key={item.feature}
                  initial={shouldAnimate ? { opacity: 0, x: -12 } : false}
                  whileInView={shouldAnimate ? { opacity: 1, x: 0 } : {}}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.04 }}
                  className="flex flex-wrap gap-x-2"
                >
                  <span className="font-semibold">{item.feature}</span>
                  <span aria-hidden="true">=</span>
                  <span>{item.principle}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer CTA */}
        <section
          className="content-wrapper section-padding border-t border-plot-border"
          aria-label="Founder and call to action"
        >
          <div className="max-w-prose mx-auto text-center">
            <p className="font-body text-plot-muted mb-2">
              Adam / Founder, PLOT
            </p>
            <p className="font-body text-plot-muted mb-2">
              Built with my partner since day one
            </p>
            <p className="font-body text-label-sm text-plot-muted mb-8">
              February 2026
            </p>
            <a
              href={APP_URL}
              className="btn-primary inline-flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plot-bg"
              aria-label="Join founding members"
            >
              Join founding members →
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
