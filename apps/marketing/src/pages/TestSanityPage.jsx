import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getBlogPosts } from '../lib/blog';

/**
 * Test page: fetches posts from Sanity and displays the first one (or a clear message).
 * Use this to confirm the Sanity client and dataset connection work before building out the full blog.
 * Route: /test-sanity (remove or restrict in production if desired).
 */
export default function TestSanityPage() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'empty' | 'error'
  const [post, setPost] = useState(
    /** @type {Array<{ _id: string; title: string; slug: { current: string }; publishedAt: string; imageUrl: string | null }>[0] | null } */ (null)
  );
  const [error, setError] = useState(/** @type {string | null } */ (null));

  useEffect(() => {
    getBlogPosts()
      .then((posts) => {
        if (posts?.length > 0) {
          setPost(posts[0]);
          setStatus('ok');
        } else {
          setStatus('empty');
        }
      })
      .catch((err) => {
        setError(err?.message ?? String(err));
        setStatus('error');
      });
  }, []);

  return (
    <>
      <Helmet>
        <title>Sanity connection test | PLOT</title>
      </Helmet>
      <div className="content-page min-h-screen bg-plot-bg">
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] text-plot-text mb-2">
          Sanity connection test
        </h1>
        <p className="font-display text-label-sm text-plot-muted tracking-wider mb-10">
          This page fetches one post from Sanity. If you see a post below, the client and dataset are working.
        </p>

        {status === 'loading' && (
          <p className="font-body text-plot-muted">Fetching posts from Sanity…</p>
        )}

        {status === 'error' && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <p className="font-body font-semibold text-plot-text">Request failed</p>
            <p className="font-body text-plot-muted mt-2">{error}</p>
            <p className="font-body text-label-sm text-plot-muted mt-4">
              Check VITE_SANITY_PROJECT_ID and VITE_SANITY_DATASET, and that the dataset is reachable (CORS).
            </p>
          </div>
        )}

        {status === 'empty' && (
          <div className="rounded-lg border border-plot-border bg-plot-elevated p-6">
            <p className="font-body text-plot-text">
              No posts in Sanity yet. Connection is working; the dataset returned an empty list.
            </p>
            <p className="font-body text-plot-muted mt-2 text-label-sm">
              Create a post in Sanity Studio (e.g. <code className="bg-plot-bg px-1 rounded">npm run dev</code> in{' '}
              <code className="bg-plot-bg px-1 rounded">sanity-studio</code>, then open localhost:3333), then refresh this page.
            </p>
          </div>
        )}

        {status === 'ok' && post && (
          <div className="rounded-lg border border-plot-border bg-plot-elevated p-6 space-y-4">
            <p className="font-body text-plot-accent-text text-label-sm font-semibold">
              ✓ Fetched a test post — Sanity client is working.
            </p>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-w-md aspect-video object-cover rounded border border-plot-border"
              />
            )}
            <dl className="font-body text-plot-text space-y-2">
              <div>
                <dt className="text-plot-muted text-label-sm">Title</dt>
                <dd className="font-semibold">{post.title}</dd>
              </div>
              <div>
                <dt className="text-plot-muted text-label-sm">Slug</dt>
                <dd className="font-mono text-label-sm">{post.slug?.current ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-plot-muted text-label-sm">Published</dt>
                <dd className="text-label-sm">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
            <p className="font-body text-label-sm text-plot-muted pt-2 border-t border-plot-border">
              Next: build the full blog (index + individual post pages), then SEO and deployment.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
