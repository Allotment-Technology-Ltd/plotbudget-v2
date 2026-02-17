import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../hooks/useTheme';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { sanitizeChangelogContent } from '../lib/sanitizeChangelog';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.plotbudget.com';
const PRICING_ENABLED = import.meta.env.VITE_PRICING_ENABLED === 'true';

export default function ChangelogPage() {
  const { theme, toggle } = useTheme();
  const [safeContent, setSafeContent] = useState('');

  useEffect(() => {
    fetch('/changelog.md')
      .then((r) => (r.ok ? r.text() : ''))
      .then((raw) => setSafeContent(sanitizeChangelogContent(raw ?? '')))
      .catch(() => setSafeContent(''));
  }, []);

  return (
    <>
      <SEO
        title="What's new | PLOT"
        description="Recent updates and improvements to PLOT — the payday ritual for households."
        url="https://plotbudget.com/changelog"
      />
      <Helmet>
        <title>What&apos;s new | PLOT</title>
      </Helmet>
      <Navbar theme={theme} onToggleTheme={toggle} pricingEnabled={PRICING_ENABLED} />
      <main id="main-content" className="min-h-screen bg-plot-bg">
        <div className="content-wrapper section-padding py-12 md:py-16">
          <h1 className="font-heading text-headline-sm md:text-headline uppercase text-plot-accent tracking-widest mb-2">
            What&apos;s new
          </h1>
          <p className="font-body text-plot-muted mb-10 max-w-narrow">
            Recent updates and improvements to PLOT. We ship regularly to make budgeting together simpler and more reliable.
          </p>
          {safeContent ? (
            <article
              className="prose prose-invert max-w-none
                prose-headings:font-heading prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-plot-accent
                prose-h2:mt-10 prose-h2:mb-4 prose-h2:first:mt-4
                prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-plot-muted prose-p:font-body prose-p:mb-4
                prose-a:text-plot-accent prose-a:no-underline hover:prose-a:underline
                prose-ul:text-plot-muted prose-ul:my-4 prose-li:font-body prose-li:my-1
                dark:prose-invert"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{safeContent}</ReactMarkdown>
            </article>
          ) : (
            <p className="font-body text-plot-muted">
              Release notes are loading… If this persists, they will appear here after the next deploy.
            </p>
          )}
        </div>
      </main>
      <Footer pricingEnabled={PRICING_ENABLED} appUrl={APP_URL} />
    </>
  );
}
