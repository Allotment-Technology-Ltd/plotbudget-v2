import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PortableText } from '@portabletext/react';

const proseClass =
  'prose prose-p:font-body prose-p:text-plot-text prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-plot-text prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wider prose-h2:text-plot-accent-text prose-h2:text-label prose-h2:!font-bold prose-h2:mt-20 prose-h2:mb-8 prose-h2:first:mt-0 prose-h2:border-b prose-h2:border-plot-border prose-h2:pb-3 prose-h3:text-plot-accent-text prose-h3:text-label-sm prose-h3:font-semibold prose-h3:mt-10 prose-h3:mb-4 [&_h2+ul]:mt-6 [&_h2+h3]:mt-6 prose-li:font-body prose-li:mb-2 prose-li:leading-relaxed prose-a:text-plot-accent-text prose-a:no-underline hover:prose-a:underline prose-ul:text-plot-text prose-ul:my-6 prose-ul:pl-6 prose-ol:text-plot-text prose-ol:my-6 prose-ol:pl-6 prose-blockquote:border-l-plot-accent prose-blockquote:border-l-4 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-plot-muted max-w-none';

const portableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="font-heading text-label font-bold uppercase tracking-wider text-plot-accent-text mt-20 mb-8 first:mt-0 border-b border-plot-border pb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-heading text-label-sm font-semibold uppercase tracking-wider text-plot-accent-text mt-10 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-heading text-label-sm font-semibold uppercase tracking-wider text-plot-accent-text mt-6 mb-3">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="font-body text-plot-text leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-plot-accent pl-6 my-6 italic text-plot-muted font-body">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside my-6 pl-6 text-plot-text font-body space-y-2">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside my-6 pl-6 text-plot-text font-body space-y-2">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-plot-accent-text no-underline hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-plot-text">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
  },
};

/**
 * Renders a single blog post (title, date, image, body). Used by BlogPostPage and BlogPreviewPage.
 * @param {{ post: { title: string; slug?: { current: string }; body?: import('@portabletext/types').PortableTextBlock[]; publishedAt?: string; imageUrl?: string | null }; isPreview?: boolean }} props
 */
export function BlogPostContent({ post, isPreview = false }) {
  if (!post?.title) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} | Blog | PLOT</title>
        <meta name="description" content={post.title} />
      </Helmet>
      <div className="content-page min-h-screen bg-plot-bg">
        {isPreview && (
          <div
            className="mb-6 rounded border border-plot-accent bg-plot-accent/10 px-4 py-2 font-heading text-label-sm uppercase tracking-wider text-plot-accent-text"
            role="status"
          >
            Preview — unpublished
          </div>
        )}
        <Link
          to="/blog"
          className="font-body text-label-sm text-plot-accent-text hover:underline mb-6 inline-block"
        >
          ← Back to blog
        </Link>
        <article>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              className="w-full aspect-video object-cover rounded-lg mb-8 border border-plot-border"
            />
          )}
          <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] text-plot-text mb-2">
            {post.title}
          </h1>
          {post.publishedAt && (
            <p className="font-body text-label-sm text-plot-muted mb-10">
              {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
          {post.body && post.body.length > 0 ? (
            <div className={proseClass}>
              <PortableText value={post.body} components={portableTextComponents} />
            </div>
          ) : (
            <p className="font-body text-plot-muted">No content yet.</p>
          )}
        </article>
      </div>
    </>
  );
}
