/**
 * GET /api/sanity-preview — Return a single post (including draft) for preview.
 *
 * Query: id (document _id, e.g. drafts.xxx or published id), secret (must match SANITY_PREVIEW_SECRET).
 * Uses SANITY_API_READ_TOKEN so drafts are visible. Only for use from Sanity Studio "Preview on site".
 */

import { createClient } from '@sanity/client'

const projectId =
  process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'a2vzaekn'
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
const token = process.env.SANITY_API_READ_TOKEN
const secret = process.env.SANITY_PREVIEW_SECRET

const query = `*[_type == "post" && _id == $id][0] {
  title,
  slug,
  body,
  publishedAt,
  "imageUrl": mainImage.asset->url
}`

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : ''
  const providedSecret = typeof req.query.secret === 'string' ? req.query.secret : ''

  if (!id) {
    return res.status(400).json({ message: 'Missing id.' })
  }
  if (!secret || providedSecret !== secret) {
    return res.status(401).json({ message: 'Invalid or missing preview secret.' })
  }
  if (!token) {
    console.error('SANITY_API_READ_TOKEN is not set; cannot fetch drafts.')
    return res.status(500).json({ message: 'Preview not configured.' })
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  })

  try {
    const post = await client.fetch(query, { id })
    if (!post?.title) {
      return res.status(404).json({ message: 'Post not found.' })
    }
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).json(post)
  } catch (err) {
    console.error('Sanity preview fetch error:', err?.message || err)
    return res.status(502).json({ message: 'Failed to fetch draft.' })
  }
}
