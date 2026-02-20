/**
 * /api/sanity-proxy — Vercel Serverless Function
 *
 * Proxies GET requests to the Sanity API so the browser never hits Sanity
 * directly (avoids CORS and CSP connect-src). Used in production/preview.
 *
 * Rewrite: /api/sanity/:path* → /api/sanity-proxy (path in query)
 * Request: GET /api/sanity-proxy?path=v2024-01-01/data/query/production&query=...
 * Forwards to: https://<projectId>.api.sanity.io/<path>?<rest of query>
 */

const SANITY_PROJECT_ID = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'a2vzaekn';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const pathRaw = req.query.path;
  const path = pathRaw == null ? '' : Array.isArray(pathRaw) ? pathRaw.join('/') : String(pathRaw);
  if (!path) {
    return res.status(400).json({ message: 'Missing path.' });
  }

  const { path: _p, ...rest } = req.query;
  const searchParams = new URLSearchParams(rest);
  const queryString = searchParams.toString();
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/${path.replace(/^\//, '')}${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).setHeader('Content-Type', response.headers.get('Content-Type') || 'application/json');
      return res.end(text);
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Sanity proxy error:', err?.message || err);
    return res.status(502).json({ message: 'Upstream request failed.' });
  }
}
