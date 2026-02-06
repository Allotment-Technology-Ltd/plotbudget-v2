import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
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

export const metadata: Metadata = {
  title: {
    default: 'PLOT — Budget Together',
    template: '%s | PLOT',
  },
  description:
    'The 15-minute payday ritual that keeps both partners on the same page — without sharing bank access.',
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
      </body>
    </html>
  );
}
