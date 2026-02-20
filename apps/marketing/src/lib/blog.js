import { getSanityClient } from './sanity';

/**
 * Fetch all published blog posts, newest first.
 * @returns {Promise<Array<{ _id: string, title: string, slug: { current: string }, publishedAt: string, imageUrl: string | null }>>}
 */
export async function getBlogPosts() {
  return getSanityClient().fetch(
    `*[_type == "post" && !(_id in path("drafts.**")) && archived != true] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      "imageUrl": mainImage.asset->url
    }`
  );
}

/** Normalize slug for URL matching: strip leading / and "blog/" */
function normalizeSlug(raw) {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/^\/?blog\/?/, '').replace(/^\//, '') || raw;
}

/**
 * Fetch a single post by slug (URL segment, e.g. "how-to-manage-money-as-a-couple").
 * Tries exact slug match, then "blog/" + slug, then finds by matching normalized slug in full list.
 * @param {string} slug
 * @returns {Promise<{ title: string, slug: { current: string }, body: import('@portabletext/types').PortableTextBlock[], publishedAt: string, imageUrl: string | null } | null>}
 */
export async function getBlogPost(slug) {
  if (!slug) return null;
  const client = getSanityClient();
  const slugWithBlog = `blog/${slug}`;
  const bySlugQuery = `*[_type == "post" && !(_id in path("drafts.**")) && (slug.current == $slug || slug.current == $slugWithBlog)][0] {
    title,
    slug,
    body,
    publishedAt,
    "imageUrl": mainImage.asset->url
  }`;
  let post = await client.fetch(bySlugQuery, { slug, slugWithBlog });
  if (post?.title) return post;

  // Fallback: same list as index, find by normalized slug (handles any slug format in Sanity)
  const posts = await getBlogPosts();
  const normalized = normalizeSlug(slug);
  const match = posts?.find((p) => normalizeSlug(p.slug?.current) === normalized);
  if (!match) return null;

  const fullQuery = `*[_type == "post" && _id == $id][0] {
    title,
    slug,
    body,
    publishedAt,
    "imageUrl": mainImage.asset->url
  }`;
  return client.fetch(fullQuery, { id: match._id });
}
