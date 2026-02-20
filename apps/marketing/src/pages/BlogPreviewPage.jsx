import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { BlogPostContent } from '../components/BlogPostContent';

/**
 * Preview a blog post by document id (including drafts). Used from Sanity Studio "Preview on site".
 * Query: id (document _id), secret (SANITY_PREVIEW_SECRET).
 */
export default function BlogPreviewPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const secret = searchParams.get('secret') ?? '';

  const [post, setPost] = useState(
    /** @type {{ title: string; slug: { current: string }; body: import('@portabletext/types').PortableTextBlock[]; publishedAt: string; imageUrl: string | null } | null } */ (null)
  );
  const [status, setStatus] = useState(/** @type {'idle' | 'loading' | 'found' | 'error'} */ ('idle'));
  const [error, setError] = useState(/** @type {string | null } */ (null));

  useEffect(() => {
    if (!id || !secret) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setError(null);
    const params = new URLSearchParams({ id, secret });
    fetch(`/api/sanity-preview?${params.toString()}`)
      .then((res) => {
        if (!res.ok) return res.json().then((body) => Promise.reject(new Error(body?.message || res.statusText)));
        return res.json();
      })
      .then((data) => {
        setPost(data);
        setStatus('found');
      })
      .catch((err) => {
        setError(err?.message ?? String(err));
        setStatus('error');
      });
  }, [id, secret]);

  if (!id || !secret) {
    return (
      <div className="content-page min-h-screen bg-plot-bg">
        <Helmet>
          <title>Preview | Blog | PLOT</title>
        </Helmet>
        <p className="font-body text-plot-muted">Preview requires <code className="text-plot-text">id</code> and <code className="text-plot-text">secret</code> in the URL. Use “Preview on site” from Sanity Studio.</p>
        <Link to="/blog" className="font-body text-plot-accent-text hover:underline mt-4 inline-block">
          Back to blog
        </Link>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="content-page min-h-screen bg-plot-bg">
        <Helmet>
          <title>Loading preview… | Blog | PLOT</title>
        </Helmet>
        <p className="font-body text-plot-muted">Loading preview…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="content-page min-h-screen bg-plot-bg">
        <Helmet>
          <title>Preview error | Blog | PLOT</title>
        </Helmet>
        <p className="font-body text-plot-muted">Couldn’t load preview.</p>
        {error && <p className="font-body text-label-sm text-plot-muted mt-2">{error}</p>}
        <Link to="/blog" className="font-body text-plot-accent-text hover:underline mt-4 inline-block">
          Back to blog
        </Link>
      </div>
    );
  }

  if (status === 'found' && post) {
    return <BlogPostContent post={post} isPreview />;
  }

  return null;
}
