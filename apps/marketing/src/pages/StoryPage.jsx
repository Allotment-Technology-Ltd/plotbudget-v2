import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion } from 'framer-motion';
import { APP_URL } from '../lib/config';

const storyStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const storyItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const beats = [
  {
    id: 1,
    label: '01',
    headline: 'For 10 years, I was the \'chancellor\' of my household.',
    paragraphs: [
      'Every payday, I\'d update our spreadsheet. Every week, I\'d chase my partner to send her transaction list. Every month, I\'d copy-paste formulas, update tabs, and hope nothing broke.',
      'I was the one who knew where the money was. I was the one who said \'yes\' or \'no\' to spending. I didn\'t want that power. My partner didn\'t want to be dependent on me for it.',
      'But every budgeting app we tried made it worse.',
    ],
    pullQuote: null,
  },
  {
    id: 2,
    label: '02',
    headline: 'I tried everything.',
    paragraphs: [
      'YNAB was too expensive and overwhelming. Banking apps wanted too much data and didn\'t fit our workflow. Spreadsheets were flexible but broke every time life changed.',
      'After 10 years of \'build-measure-learn\' on a Google Sheet that required constant maintenance, I realised: I\'m solving the wrong problem.',
      'We didn\'t need better transaction tracking. We needed to agree on the plan BEFORE payday, together, in 20 minutes.',
    ],
    pullQuote: null,
  },
  {
    id: 3,
    label: '03',
    headline: 'Then came the pub conversation.',
    paragraphs: [
      'One night, a colleague mentioned he was \'the household chancellor.\' Everyone around the table nodded. Someone said: \'I thought that was just me.\'',
      'That\'s when I realised this isn\'t a personal problem. It\'s universal.',
      'Couples don\'t need better spreadsheets. They need a way to plan together, without one person becoming the gatekeeper.',
    ],
    pullQuote: 'I thought that was just me.',
  },
  {
    id: 4,
    label: '04',
    headline: 'But it wasn\'t just money.',
    paragraphs: [
      'As I talked to more people, I realised: the spreadsheet problem isn\'t just budgeting. It\'s meal plans. Shopping lists. Holiday planning. Renovation tracking. Document storage. Home maintenance.',
      'People were managing their entire households across 6 disconnected apps, 3 spreadsheets, and 47 sticky notes.',
      'You don\'t want 6 subscriptions. You want one operating system.',
      'PLOT became that system.',
    ],
    pullQuote: null,
  },
  {
    id: 5,
    label: '05',
    headline: 'My partner has been testing PLOT since day one.',
    paragraphs: [
      'She\'s given me honest feedback about what works, what doesn\'t, what makes sense, what she wouldn\'t use.',
      'PLOT isn\'t built in isolation. It\'s built in conversation—with my partner, with founding members, with every household that joins.',
      'Because the best tools emerge from partnership, not command.',
      'This is the tool I wish I\'d had 10 years ago. Now it\'s yours too.',
    ],
    pullQuote: null,
  },
];

export default function StoryPage() {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !reducedMotion;

  return (
    <>
      <Helmet>
        <title>Why PLOT Exists | The Story</title>
        <meta
          name="description"
          content="How a decade of spreadsheet frustration became a household operating system designed for equity, simplicity, and partnership."
        />
        <meta property="og:title" content="Why PLOT Exists | The Story" />
        <meta property="og:description" content="How a decade of spreadsheet frustration became a household operating system designed for equity, simplicity, and partnership." />
        <meta property="og:url" content="https://plotbudget.com/story" />
        <meta name="twitter:title" content="Why PLOT Exists | The Story" />
        <meta name="twitter:description" content="How a decade of spreadsheet frustration became a household operating system designed for equity, simplicity, and partnership." />
      </Helmet>

      <div className="min-h-screen bg-plot-bg">
        {/* Hero */}
        <section
          className="content-wrapper section-padding text-center"
          aria-labelledby="story-title"
        >
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-prose mx-auto"
          >
            <h1
              id="story-title"
              className="font-heading text-display-sm md:text-display-lg font-bold uppercase tracking-[0.08em] text-plot-text mb-6"
            >
              Why PLOT Exists
            </h1>
            <p className="font-body text-sub-sm md:text-sub text-plot-muted leading-relaxed">
              The story of how a decade of spreadsheet frustration became a household operating system.
            </p>
          </motion.div>
        </section>

        {/* Story arc with timeline */}
        <section
          className="content-wrapper section-padding border-t border-plot-border"
          aria-label="The story"
        >
          <div className="max-w-prose mx-auto relative">
            {/* Timeline line */}
            <div
              className="absolute left-4 top-4 bottom-4 w-px bg-plot-border"
              aria-hidden="true"
            />

            <motion.div
              variants={shouldAnimate ? storyStagger : {}}
              initial={shouldAnimate ? 'hidden' : false}
              whileInView={shouldAnimate ? 'visible' : {}}
              viewport={{ once: true, amount: 0.05 }}
              className="space-y-16 md:space-y-20"
            >
              {beats.map((beat) => (
                <motion.article
                  key={beat.id}
                  id={`beat-${beat.label}`}
                  variants={shouldAnimate ? storyItem : {}}
                  className="relative pl-14"
                >
                  {/* Timeline node */}
                  <div
                    className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-plot-accent bg-plot-bg font-heading text-label-sm text-plot-accent-text"
                    aria-hidden="true"
                  >
                    {beat.label}
                  </div>

                  <h2 className="font-heading text-headline-sm md:text-sub font-bold uppercase tracking-[0.04em] text-plot-text mb-4">
                    {beat.headline}
                  </h2>

                  <div className="space-y-4">
                    {beat.paragraphs.map((para, i) => (
                      <p key={i} className="font-body text-plot-text leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>

                  {beat.pullQuote && (
                    <blockquote className="mt-6 font-body text-sub-sm text-plot-muted italic border-l-2 border-plot-accent pl-4">
                      &ldquo;{beat.pullQuote}&rdquo;
                    </blockquote>
                  )}
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Founder signature */}
        <section
          className="content-wrapper section-padding border-t border-plot-border"
          aria-label="Founder signature"
        >
          <div className="max-w-prose mx-auto">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="font-body text-plot-text space-y-1"
            >
              <p>— Adam</p>
              <p className="font-medium">Founder, PLOT</p>
              <p className="text-plot-muted">Built with my partner since day one</p>
              <p className="text-label-sm text-plot-muted">February 2026</p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="content-wrapper section-padding border-t border-plot-border"
          aria-labelledby="story-cta-title"
        >
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-prose mx-auto text-center"
          >
            <h2
              id="story-cta-title"
              className="font-heading text-headline-sm md:text-headline font-bold uppercase tracking-[0.08em] text-plot-text mb-4"
            >
              Ready to join?
            </h2>
            <p className="font-body text-plot-muted mb-8">
              Be part of the first 100 founding members. Pay what you like. Shape what we build next.
            </p>
            <a
              href={APP_URL}
              className="btn-primary inline-flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plot-bg"
              aria-label="Join founding members"
            >
              Join founding members →
            </a>
          </motion.div>
        </section>
      </div>
    </>
  );
}
