import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageHeader } from '../components/PageHeader';
import { publicChangelogEntries } from '../data/publicChangelog';

const proseClass =
  'prose prose-p:font-body prose-p:text-plot-text prose-p:leading-relaxed prose-p:mb-4 prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wider prose-h2:text-plot-accent-text prose-h2:text-label prose-h2:!font-bold prose-h2:mt-20 prose-h2:mb-8 prose-h2:first:mt-0 prose-h2:border-b prose-h2:border-plot-border prose-h2:pb-3 prose-h3:text-plot-accent-text prose-h3:text-label-sm prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4 [&_h2+ul]:mt-6 [&_h2+h3]:mt-6 prose-li:font-body prose-li:mb-2 prose-li:leading-relaxed prose-a:text-plot-accent-text prose-a:no-underline hover:prose-a:underline prose-ul:text-plot-text prose-ul:my-6 prose-ul:pl-6 max-w-none';

/**
 * Changelog page. Renders inside Layout (Navbar/Footer from parent route).
 * Content is manually maintained in apps/marketing/src/data/publicChangelog.js.
 * Repo CHANGELOG.md is for developers and release history only.
 */
export default function ChangelogPage() {
  const hasEntries = Array.isArray(publicChangelogEntries) && publicChangelogEntries.length > 0;

  return (
    <>
      <Helmet>
        <title>What&apos;s new | PLOT</title>
        <meta
          name="description"
          content="Recent updates and improvements to PLOT — the payday ritual for households."
        />
      </Helmet>
      <div className="min-h-screen bg-plot-bg">
        <section
          className="content-wrapper pt-20 md:pt-24 pb-16 md:pb-20 xl:pb-24"
          aria-labelledby="changelog-title"
        >
          <div className="max-w-4xl mx-auto">
            <PageHeader
              title="What's new"
              subtitle="Recent updates and improvements to PLOT. We ship regularly to make budgeting together simpler and more reliable."
              titleId="changelog-title"
              variant="left"
            />
          </div>
        </section>
        <section className="content-wrapper section-padding section-divider">
          <div className="max-w-4xl mx-auto">
            {hasEntries ? (
              <article className={proseClass}>
                {publicChangelogEntries.map((entry) => (
                  <section key={entry.version} className="first:mt-0">
                    <h2 className="font-heading text-label font-bold uppercase tracking-wider border-b border-plot-border pb-3 mt-20 mb-8 first:mt-0">
                      {entry.version}
                      {entry.released_at && (
                        <span className="font-body font-normal text-plot-muted text-label-sm ml-2">
                          ({String(entry.released_at).slice(0, 10)})
                        </span>
                      )}
                    </h2>
                    <div className="[&_h3]:text-plot-accent-text [&_h3]:text-label-sm [&_h3]:font-semibold [&_h3]:mt-10 [&_h3]:mb-4">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h3: ({ children, ...props }) => (
                            <h3 {...props} className="text-plot-accent-text">
                              {children}
                            </h3>
                          ),
                          hr: () => (
                            <hr
                              className="my-10 border-0 border-t border-plot-accent/40"
                              role="separator"
                              aria-hidden="true"
                            />
                          ),
                        }}
                      >
                        {entry.content ?? ''}
                      </ReactMarkdown>
                    </div>
                  </section>
                ))}
              </article>
            ) : (
              <p className="font-body text-plot-muted">
                Release notes will appear here. Add entries in{' '}
                <code className="bg-plot-elevated px-1 text-label-sm">apps/marketing/src/data/publicChangelog.js</code>.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
