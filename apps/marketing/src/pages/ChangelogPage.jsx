import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { APP_URL } from '../lib/config';
import { sanitizeChangelogContent } from '../lib/sanitizeChangelog';

const proseClass =
  'prose prose-p:font-body prose-p:text-plot-text prose-p:leading-relaxed prose-p:mb-4 prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wider prose-h2:text-plot-accent-text prose-h2:text-label prose-h2:!font-bold prose-h2:mt-20 prose-h2:mb-8 prose-h2:first:mt-0 prose-h2:border-b prose-h2:border-plot-border prose-h2:pb-3 prose-h3:text-plot-accent-text prose-h3:text-label-sm prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4 [&_h2+ul]:mt-6 [&_h2+h3]:mt-6 prose-li:font-body prose-li:mb-2 prose-li:leading-relaxed prose-a:text-plot-accent-text prose-a:no-underline hover:prose-a:underline prose-ul:text-plot-text prose-ul:my-6 prose-ul:pl-6 max-w-none';

/**
 * Changelog page. Renders inside Layout (Navbar/Footer from parent route).
 * Fetches from app API first (admin-editable entries); falls back to static changelog.md.
 */
export default function ChangelogPage() {
  const [apiEntries, setApiEntries] = useState(
    /** @type {{ version: string; released_at: string; content: string }[] | null } */ (null)
  );
  const [safeContent, setSafeContent] = useState('');

  useEffect(() => {
    const apiUrl = `${APP_URL}/api/public/changelog`;
    const fallbackToMd = () =>
      fetch('/changelog.md')
        .then((r) => (r.ok ? r.text() : ''))
        .then((raw) => setSafeContent(sanitizeChangelogContent(raw ?? '')))
        .catch(() => setSafeContent(''));

    fetch(apiUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.entries?.length > 0) {
          setApiEntries(data.entries);
        } else {
          setApiEntries([]);
          return fallbackToMd();
        }
      })
      .catch(() => fallbackToMd());
  }, []);

  const isLoading = apiEntries === null && !safeContent;
  const hasApiEntries = Array.isArray(apiEntries) && apiEntries.length > 0;

  return (
    <>
      <Helmet>
        <title>What&apos;s new | PLOT</title>
        <meta
          name="description"
          content="Recent updates and improvements to PLOT — the payday ritual for households."
        />
      </Helmet>
      <div className="content-page min-h-screen bg-plot-bg">
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] text-plot-text mb-2">
          What&apos;s new
        </h1>
        <p className="font-display text-label-sm text-plot-muted tracking-wider mb-12">
          Recent updates and improvements to PLOT. We ship regularly to make budgeting together simpler and more reliable.
        </p>
        {hasApiEntries ? (
          <article className={proseClass}>
            {apiEntries.map((entry) => (
              <section key={entry.version} className="first:mt-0">
                <h2 className="font-heading text-label font-bold uppercase tracking-wider border-b border-plot-border pb-3 mt-20 mb-8 first:mt-0">
                  {entry.version}
                  {entry.released_at && (
                    <span className="font-body font-normal text-plot-muted text-label-sm ml-2">
                      ({entry.released_at.slice(0, 10)})
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
                    {sanitizeChangelogContent(entry.content ?? '')}
                  </ReactMarkdown>
                </div>
              </section>
            ))}
          </article>
        ) : safeContent ? (
          <article className={proseClass}>
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
              {safeContent}
            </ReactMarkdown>
          </article>
        ) : isLoading ? (
          <p className="font-body text-plot-muted">
            Release notes are loading…
          </p>
        ) : (
          <p className="font-body text-plot-muted">
            Release notes will appear here after the next deploy.
          </p>
        )}
      </div>
    </>
  );
}
