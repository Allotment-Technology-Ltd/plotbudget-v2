import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  PoundSterling,
  Layers,
  CheckSquare,
  Calendar,
  Utensils,
  Plane,
  Lock,
  Home,
  Baby,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { APP_URL } from '../lib/config';

const cardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const iconMap = {
  PoundSterling,
  Layers,
  CheckSquare,
  Calendar,
  Utensils,
  Plane,
  Lock,
  Home,
  Baby,
};

const statusStyles = {
  'Live in Beta': 'bg-plot-accent/20 text-plot-accent-text border-plot-accent/40',
  'In Development': 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40',
  'Planned - Next': 'bg-plot-muted/20 text-plot-muted border-plot-border',
  Planned: 'bg-plot-muted/20 text-plot-muted border-plot-border',
  'Planned - Conditional': 'bg-plot-muted/20 text-plot-muted border-plot-border',
};

function ModuleCard({
  id,
  name,
  iconKey,
  description,
  features,
  status,
  note,
  expanded,
  onToggle,
  shouldAnimate,
  variants,
}) {
  const Icon = iconMap[iconKey];
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      layout
      variants={shouldAnimate ? variants : {}}
      className="border border-plot-border bg-plot-surface overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-6 md:p-8 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-inset"
        aria-expanded={expanded}
        aria-controls={`module-detail-${id}`}
        id={`module-heading-${id}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 flex items-start gap-3 sm:gap-4">
            <span
              className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center border border-plot-border-accent text-plot-accent-text"
              aria-hidden="true"
            >
              {Icon ? <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} /> : null}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-sub-sm md:text-sub font-bold uppercase tracking-wider text-plot-text break-words">
                {name}
              </h3>
              <p className="font-body text-plot-muted text-sm mt-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0 sm:w-[12rem]">
            <span
              className={`font-heading text-xs sm:text-label-sm uppercase tracking-wider border px-2 py-1 text-center min-w-0 max-w-full truncate ${statusStyles[status] ?? statusStyles.Planned}`}
              title={status}
            >
              {status}
            </span>
            <span className="text-plot-muted shrink-0" aria-hidden="true">
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </span>
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`module-detail-${id}`}
            role="region"
            aria-labelledby={`module-heading-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: { height: { duration: reducedMotion ? 0.01 : 0.3 }, opacity: { duration: 0.2 } },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { height: { duration: reducedMotion ? 0.01 : 0.25 }, opacity: { duration: 0.15 } },
            }}
            className="border-t border-plot-border"
          >
            <div className="px-4 pb-4 pt-2 sm:px-6 sm:pb-6 md:px-8 md:pb-8 md:pt-4">
              <p className="font-heading text-label-sm uppercase tracking-wider text-plot-accent-text mb-3">
                Key features
              </p>
              <ul className="space-y-2 font-body text-plot-text text-sm" role="list">
                {features.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-plot-accent-text shrink-0" aria-hidden="true">—</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {note && (
                <p className="mt-4 font-body text-sm text-plot-muted italic border-l-2 border-plot-border pl-4">
                  {note}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

const roadmap = {
  now: [
    {
      id: 'money',
      name: 'Money',
      iconKey: 'PoundSterling',
      description: 'Budget planning and the 20-minute payday ritual',
      status: 'Live in Beta',
      features: [
        'Monthly payday ritual (20-minute guided ceremony)',
        'Blueprint planning (allocate income across categories)',
        'Seed tracking (bills, savings, wants, repayments)',
        'Fair split calculator (for couples with separate accounts)',
        'Pay cycle management (solo or couple mode)',
        '50/30/10/10 framework with visual breakdowns',
      ],
      note: null,
    },
  ],
  next: [
    {
      id: 'platform',
      name: 'Platform Foundation',
      iconKey: 'Layers',
      description: 'Core infrastructure for the module ecosystem',
      status: 'In Development',
      features: [
        'Notification engine (in-app + email digests)',
        'Activity feed (household timeline of all actions)',
        'Module navigation (mobile bottom tabs + web sidebar)',
        'Global search (across all modules)',
        'Subscription tier gating (Free vs Pro)',
      ],
      note: null,
    },
    {
      id: 'tasks',
      name: 'Tasks & Projects',
      iconKey: 'CheckSquare',
      description: 'Chores, to-dos, and multi-phase household projects',
      status: 'In Development',
      features: [
        'Weekly Reset ceremony (10-minute Sunday ritual)',
        'Recurring chore templates (auto-generate weekly tasks)',
        'Project planning (phases, kanban boards, timelines)',
        'Fairness tracking (task distribution over time)',
        'Cross-module linking (project → repayment, meal → shopping task)',
      ],
      note: null,
    },
    {
      id: 'calendar',
      name: 'Calendar',
      iconKey: 'Calendar',
      description: 'Shared household calendar, not individual schedules',
      status: 'Planned - Next',
      features: [
        'Household view (everyone\'s commitments visible)',
        'Event categories (work, personal, family, home maintenance)',
        'Weekly Lookahead integration with Weekly Reset',
        'iCal sync (import external calendars)',
        'Reminder system (integrated with notifications)',
      ],
      note: null,
    },
  ],
  later: [
    {
      id: 'meals',
      name: 'Meals & Groceries',
      iconKey: 'Utensils',
      description: 'Meal planning and shopping list management',
      status: 'Planned',
      features: [
        'Meal planning interface (weekly grid)',
        'Recipe library (with ingredient lists)',
        'Auto-generated shopping lists (from meal selections)',
        'Budget integration (grocery seed tracking)',
        'Rotation suggestions (based on past meals)',
      ],
      note: null,
    },
    {
      id: 'holidays',
      name: 'Holidays & Trips',
      iconKey: 'Plane',
      description: 'Trip planning from idea to packing list',
      status: 'Planned',
      features: [
        'Trip Planning ceremony (20-minute guided session)',
        'Itinerary builder (days, activities, bookings)',
        'Budget integration (auto-create savings pot + spend tracking)',
        'Packing list generator (with weather integration)',
        'Document links (passports, tickets, insurance)',
      ],
      note: null,
    },
    {
      id: 'vault',
      name: 'Vault',
      iconKey: 'Lock',
      description: 'Secure document storage and renewal tracking',
      status: 'Planned',
      features: [
        'Document upload and categorisation',
        'Expiry/renewal reminders (passports, insurance, MOT)',
        'Emergency card (critical info in one place)',
        'Secure sharing (within household only)',
        'Search and tag system',
      ],
      note: null,
    },
    {
      id: 'home',
      name: 'Home Maintenance',
      iconKey: 'Home',
      description: 'Track maintenance, repairs, and seasonal tasks',
      status: 'Planned',
      features: [
        'Maintenance log (appliances, utilities, structure)',
        'Quarterly Health Check ceremony (seasonal checklist)',
        'Contractor tracking (contact info, past work, costs)',
        'Warranty/manual storage (links to Vault)',
        'Task integration (maintenance → auto-create task)',
      ],
      note: null,
    },
    {
      id: 'kids',
      name: 'Kids',
      iconKey: 'Baby',
      description: 'Child profiles, activities, and school calendar',
      status: 'Planned - Conditional',
      features: [
        'Child profiles (sizes, medical info, documents)',
        'School calendar (term view, events, holidays)',
        'Activities manager (weekly timetable, costs)',
        'Childcare rota (pickup/dropoff assignments)',
        'Growth log (height, weight, milestones)',
      ],
      note: 'This module ships only if user demand validates it. We don\'t build speculatively.',
    },
  ],
};

function mapApiFeaturesToRoadmap(features) {
  if (!Array.isArray(features) || features.length === 0) return null;
  const sorted = [...features].sort((a, b) => Number(b.display_order ?? 0) - Number(a.display_order ?? 0));
  const byStatus = { now: [], next: [], later: [] };
  const statusToBucket = { now: 'now', shipped: 'now', next: 'next', later: 'later' };
  const statusLabel = { now: 'Live in Beta', next: 'In Development', later: 'Planned', shipped: 'Live in Beta' };
  for (const f of sorted) {
    const bucket = statusToBucket[f.status] || 'later';
    byStatus[bucket].push({
      id: f.module_key || f.id,
      name: f.title,
      iconKey: f.icon_name,
      description: f.description,
      status: statusLabel[f.status] || 'Planned',
      features: f.key_features || [],
      note: null,
    });
  }
  return byStatus;
}

export default function RoadmapPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [roadmapData, setRoadmapData] = useState(roadmap);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = !reducedMotion;

  useEffect(() => {
    const url = `${APP_URL}/api/public/roadmap`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const mapped = data?.features?.length ? mapApiFeaturesToRoadmap(data.features) : null;
        if (mapped) setRoadmapData(mapped);
      })
      .catch(() => {});
  }, []);

  const toggleExpanded = (id) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <>
      <Helmet>
        <title>Roadmap | PLOT</title>
        <meta
          name="description"
          content="See what we're building: from budgeting app to household operating system. Eight interconnected modules launching over the next 12 months."
        />
        <meta property="og:title" content="Roadmap | PLOT" />
        <meta property="og:description" content="See what we're building: from budgeting app to household operating system. Eight interconnected modules launching over the next 12 months." />
        <meta property="og:url" content="https://plotbudget.com/roadmap" />
        <meta name="twitter:title" content="Roadmap | PLOT" />
        <meta name="twitter:description" content="See what we're building: from budgeting app to household operating system. Eight interconnected modules launching over the next 12 months." />
      </Helmet>

      <div className="min-h-screen bg-plot-bg">
        {/* Hero — consistent page header */}
        <section
          className="content-wrapper pt-20 md:pt-24 pb-16 md:pb-20 xl:pb-24"
          aria-labelledby="roadmap-title"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <PageHeader
                title="Roadmap"
                subtitle="From budgeting app to household operating system."
                titleId="roadmap-title"
                variant="left"
              >
                <div className="font-body text-plot-text leading-relaxed space-y-4 text-left">
                  <p>
                    PLOT launched with Money (budgeting and the payday ritual). Over the coming year, we&apos;re expanding into a complete household operating system with eight interconnected modules.
                  </p>
                  <p>
                    Each module follows the same philosophy: opinionated ceremonies instead of blank canvases. Simple rituals instead of daily tracking. Built for households, not individuals.
                  </p>
                </div>
              </PageHeader>
            </motion.div>
          </div>
        </section>

        {/* Interconnection callout — same vertical rhythm as timeline (section-padding) for clear hierarchy */}
        <section className="content-wrapper section-padding section-divider" aria-label="Why an operating system">
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto border-l-4 border-plot-accent bg-plot-surface border border-plot-border p-6 md:p-8"
          >
            <h2 className="font-heading text-sub-sm md:text-sub font-bold uppercase tracking-wider text-plot-text mb-4">
              Why an Operating System?
            </h2>
            <p className="font-body text-plot-text mb-4">
              These modules aren&apos;t separate apps. They talk to each other:
            </p>
            <ul className="font-body text-plot-text text-sm space-y-2" role="list">
              <li className="flex gap-2">
                <span className="text-plot-accent-text shrink-0">—</span>
                <span>A holiday automatically creates: a savings pot (Money), calendar events (Calendar), packing tasks (Tasks), and document storage (Vault)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-plot-accent-text shrink-0">—</span>
                <span>A renovation project links to: a repayment plan (Money), task phases (Tasks), and contractor info (Home Maintenance)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-plot-accent-text shrink-0">—</span>
                <span>A meal plan generates: shopping list items (Meals) and spending tracking (Money)</span>
              </li>
            </ul>
            <p className="font-body text-plot-text mt-4 font-medium">
              That&apos;s what makes a household system different from a collection of separate apps—single-purpose tools can&apos;t do this.
            </p>
          </motion.div>
        </section>

        {/* Roadmap timeline */}
        <section className="content-wrapper section-padding section-divider" aria-label="Roadmap timeline">
          <div className="max-w-4xl mx-auto space-y-16 md:space-y-20">
            {/* NOW */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="font-heading text-label-sm uppercase tracking-[0.2em] text-plot-accent-text">
                  Now
                </span>
                <span className="h-px flex-1 bg-plot-border" aria-hidden="true" />
              </div>
              <p className="font-body text-plot-muted text-sm mb-6">Currently available</p>
              <motion.div
                variants={shouldAnimate ? cardStagger : {}}
                initial={shouldAnimate ? 'hidden' : false}
                whileInView={shouldAnimate ? 'visible' : {}}
                viewport={{ once: true, amount: 0.1 }}
                className="space-y-4"
              >
                {roadmapData.now.map((module) => (
                  <ModuleCard
                    key={module.id}
                    {...module}
                    expanded={expandedId === module.id}
                    onToggle={() => toggleExpanded(module.id)}
                    shouldAnimate={shouldAnimate}
                    variants={cardItem}
                  />
                ))}
              </motion.div>
            </div>

            {/* NEXT */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="font-heading text-label-sm uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  Next
                </span>
                <span className="h-px flex-1 bg-plot-border" aria-hidden="true" />
              </div>
              <p className="font-body text-plot-muted text-sm mb-6">In active development</p>
              <motion.div
                variants={shouldAnimate ? cardStagger : {}}
                initial={shouldAnimate ? 'hidden' : false}
                whileInView={shouldAnimate ? 'visible' : {}}
                viewport={{ once: true, amount: 0.05 }}
                className="space-y-4"
              >
                {roadmapData.next.map((module) => (
                  <ModuleCard
                    key={module.id}
                    {...module}
                    expanded={expandedId === module.id}
                    onToggle={() => toggleExpanded(module.id)}
                    shouldAnimate={shouldAnimate}
                    variants={cardItem}
                  />
                ))}
              </motion.div>
            </div>

            {/* LATER */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="font-heading text-label-sm uppercase tracking-[0.2em] text-plot-muted">
                  Later
                </span>
                <span className="h-px flex-1 bg-plot-border" aria-hidden="true" />
              </div>
              <p className="font-body text-plot-muted text-sm mb-6">Planned for future</p>
              <motion.div
                variants={shouldAnimate ? cardStagger : {}}
                initial={shouldAnimate ? 'hidden' : false}
                whileInView={shouldAnimate ? 'visible' : {}}
                viewport={{ once: true, amount: 0.05 }}
                className="space-y-4"
              >
                {roadmapData.later.map((module) => (
                  <ModuleCard
                    key={module.id}
                    {...module}
                    expanded={expandedId === module.id}
                    onToggle={() => toggleExpanded(module.id)}
                    shouldAnimate={shouldAnimate}
                    variants={cardItem}
                  />
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* How we decide */}
        <section
          className="content-wrapper section-padding section-divider"
          aria-labelledby="how-we-decide-title"
        >
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
            whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h2
              id="how-we-decide-title"
              className="font-heading text-headline-sm md:text-headline font-bold uppercase tracking-[0.08em] text-plot-text mb-6"
            >
              How we decide what to build
            </h2>
            <div className="font-body text-plot-text leading-relaxed space-y-4">
              <p>
                PLOT&apos;s roadmap isn&apos;t fixed. It&apos;s shaped by founding member feedback, usage patterns, and demand signals.
              </p>
              <p>
                The order above (Tasks → Calendar → Meals → Holidays → Vault → Home → Kids) is our current hypothesis based on:
              </p>
              <ul className="list-none space-y-2 pl-0" role="list">
                <li className="flex gap-2">
                  <span className="text-plot-accent-text shrink-0">—</span>
                  <span>Which modules unlock the most value fastest</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-plot-accent-text shrink-0">—</span>
                  <span>Which modules depend on others (Calendar needs Tasks, Meals needs Calendar)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-plot-accent-text shrink-0">—</span>
                  <span>Which problems founding members report most frequently</span>
                </li>
              </ul>
              <p>
                But we validate demand at each stage gate before committing to the next module. If founding members overwhelmingly want Holidays before Meals, we&apos;ll adjust.
              </p>
              <p className="font-medium text-plot-text">
                Want to influence what gets built next?
              </p>
            </div>
            <div className="mt-8">
              <a
                href={APP_URL}
                className="btn-primary inline-flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-plot-accent focus-visible:ring-offset-2 focus-visible:ring-offset-plot-bg"
                aria-label="Join as a founding household"
              >
                Join as a founding household →
              </a>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
