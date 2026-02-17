import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeChangelogContent } from '../lib/sanitizeChangelog';

/**
 * Changelog page. Renders inside Layout (Navbar/Footer from parent route).
 * Uses same content formatting as Privacy/Terms (content-page container + legal-style typography).
 */
export default function ChangelogPage() {
  const [safeContent, setSafeContent] = useState('');

  useEffect(() => {
    fetch('/changelog.md')
      .then((r) => (r.ok ? r.text() : ''))
      .then((raw) => setSafeContent(sanitizeChangelogContent(raw ?? '')))
      .catch(() => setSafeContent(''));
  }, []);

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
        {safeContent ? (
          <article
            className="
              prose prose-p:font-body prose-p:text-plot-text prose-p:leading-relaxed prose-p:mb-4
              prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wider
              prose-h2:text-plot-accent prose-h2:text-label prose-h2:!font-bold
              prose-h2:mt-20 prose-h2:mb-8 prose-h2:first:mt-0
              prose-h2:border-b prose-h2:border-plot-border prose-h2:pb-3
              prose-h3:text-plot-accent prose-h3:text-label-sm prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4
              [&_h2+ul]:mt-6 [&_h2+h3]:mt-6
              prose-li:font-body prose-li:mb-2 prose-li:leading-relaxed
              prose-a:text-plot-accent prose-a:no-underline hover:prose-a:underline
              prose-ul:text-plot-text prose-ul:my-6 prose-ul:pl-6
              max-w-none
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children, ...props }) => (
                  <h3 {...props} className="text-plot-accent">
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
        ) : (
          <p className="font-body text-plot-muted">
            Release notes are loading… If this persists, they will appear here after the next deploy.
          </p>
        )}
      </div>
    </>
  );
}
