import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getBlogPosts } from '../lib/blog';

/**
 * Blog index. Lists all posts from Sanity, newest first.
 * Renders inside Layout (Navbar/Footer from parent route).
 */
export default function BlogIndexPage() {
  const [posts, setPosts] = useState(
    /** @type {Array<{ _id: string; title: string; slug: { current: string }; publishedAt: string; imageUrl: string | null }> | null } */ (null)
  );
  const [error, setError] = useState(/** @type {string | null } */ (null));

  useEffect(() => {
    setError(null);
    getBlogPosts()
      .then(setPosts)
      .catch((err) => {
        setPosts([]);
        setError(err?.message ?? String(err));
      });
  }, []);

  const isLoading = posts === null && !error;

  return (
    <>
      <Helmet>
        <title>Blog | PLOT</title>
        <meta
          name="description"
          content="Stories and updates from PLOT — the payday ritual for households."
        />
      </Helmet>
      <div className="content-page min-h-screen bg-plot-bg">
        <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-[0.08em] text-plot-text mb-2">
          Blog
        </h1>
        <p className="font-display text-label-sm text-plot-muted tracking-wider mb-12">
          Stories and updates from the PLOT team.
        </p>
        {error ? (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 max-w-prose">
            <p className="font-body font-semibold text-plot-text">Couldn’t load posts</p>
            <p className="font-body text-plot-muted mt-2 text-label-sm">{error}</p>
            <p className="font-body text-plot-muted mt-2 text-label-sm">
              Check the browser console for details. Ensure <code className="bg-plot-elevated px-1">VITE_SANITY_PROJECT_ID</code> and <code className="bg-plot-elevated px-1">VITE_SANITY_DATASET</code> match your Sanity project (defaults: a2vzaekn, production).
            </p>
          </div>
        ) : isLoading ? (
          <p className="font-body text-plot-muted">Loading posts…</p>
        ) : posts?.length === 0 ? (
          <p className="font-body text-plot-muted">No posts yet. Check back soon.</p>
        ) : (
          <ul className="space-y-10 list-none p-0 m-0">
            {posts?.map((post) => {
              const raw = post.slug?.current ?? post._id;
              const slug = typeof raw === 'string' ? raw.replace(/^\/?blog\/?/, '').replace(/^\//, '') || raw : raw;
              return (
              <li key={post._id}>
                <article>
                  <Link
                    to={`/blog/${slug}`}
                    className="group block no-underline text-inherit"
                  >
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="w-full aspect-video object-cover rounded-lg mb-4 border border-plot-border"
                      />
                    )}
                    <h2 className="font-heading text-xl md:text-2xl font-bold uppercase tracking-wider text-plot-text group-hover:text-plot-accent-text transition-colors">
                      {post.title}
                    </h2>
                    {post.publishedAt && (
                      <p className="font-body text-label-sm text-plot-muted mt-1">
                        {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                    <span className="font-body text-plot-accent-text text-label-sm mt-2 inline-block group-hover:underline">
                      Read more
                    </span>
                  </Link>
                </article>
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
