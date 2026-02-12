/**
 * /api/subscribe — Vercel Serverless Function
 *
 * Proxies waitlist signups to the MailerLite API.
 * The MAILERLITE_API_KEY env var is set in Vercel's dashboard,
 * never exposed to the client bundle.
 *
 * Request:  POST { email: string }
 * Response: 200 { success: true } | 4xx/5xx { message: string }
 */

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { email } = req.body || {};

  // Validate email server-side (defense in depth)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  const GROUP_ID = process.env.MAILERLITE_GROUP_ID;

  if (!API_KEY) {
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  try {
    // Build the MailerLite subscriber payload
    const payload = {
      email: email.trim().toLowerCase(),
    };

    // Optionally add to a specific group
    if (GROUP_ID) {
      payload.groups = [GROUP_ID];
    }

    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // MailerLite returns detailed error messages
      const mlMessage = data?.message || 'Subscription failed.';

      // 422 often means "already subscribed" — treat as success
      if (response.status === 422 && mlMessage.includes('already')) {
        return res.status(200).json({ success: true, alreadySubscribed: true });
      }

      return res.status(response.status).json({ message: mlMessage });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ message: 'Internal server error. Please try again.' });
  }
}
