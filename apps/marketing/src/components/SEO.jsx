import { Helmet } from 'react-helmet-async';

/**
 * SEO — Manages all <head> meta tags for the PLOT marketing page.
 *
 * Includes:
 *  - Standard HTML meta (title, description)
 *  - Open Graph tags (Facebook, LinkedIn, iMessage previews)
 *  - Twitter Card tags
 *  - Schema.org JSON-LD structured data (SoftwareApplication)
 *  - Canonical URL
 */
export default function SEO({
  title = 'PLOT — Budgeting for Households | Privacy-First Payday Ritual',
  description = 'The 20-minute payday ritual that replaces every awkward money conversation. For UK households — no bank access, no data scraping. Join the waitlist.',
  url = 'https://plotbudget.com',
  ogImage = 'https://plotbudget.com/og-image.png',
  siteName = 'PLOT Budget',
}) {
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PLOT Budget',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'GBP',
      availability: 'https://schema.org/PreOrder',
    },
    url,
    author: {
      '@type': 'Organization',
      name: siteName,
    },
  };

  return (
    <Helmet>
      {/* Standard */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_GB" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org structured data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrg)}
      </script>
    </Helmet>
  );
}
