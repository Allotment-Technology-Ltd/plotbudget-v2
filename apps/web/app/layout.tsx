import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '../components/providers/theme-provider';
import { PostHogProvider } from '../components/providers/posthog-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.plotbudget.com';
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://plotbudget.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PLOT — Budget Together',
    template: '%s | PLOT',
  },
  description:
    'The 20-minute payday ritual that replaces every awkward money conversation. For UK households — without sharing bank access.',
  icons: {
    icon: [
      {
        url: '/favicon-light.svg?v=3',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon-dark.svg?v=3',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      },
      { url: '/favicon-dark.svg?v=3', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.svg?v=3', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: APP_URL,
    siteName: 'PLOT Budget',
    images: [
      {
        url: `${MARKETING_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'PLOT — The 20-minute payday ritual for UK households',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${MARKETING_URL}/og-image.png`],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F0EA' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceMono.variable}`}
    >
      <head />
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main id="main-content">{children}</main>
            <Toaster position="top-right" />
          </ThemeProvider>
        </PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
