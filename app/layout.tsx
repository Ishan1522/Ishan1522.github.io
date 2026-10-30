import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { MotionProvider } from '@/components/providers/MotionProvider';
import { personal } from '@/data/personal';

// Instrument Serif for display type, Instrument Sans for text, JetBrains Mono
// only for small technical accents. Loaded via next/font so they're
// self-hosted and zero-FOUT.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${personal.name} — ${personal.role}`,
  description: personal.short,
  authors: [{ name: personal.name }],
  keywords: [
    'Ishan',
    'Electrical Engineering',
    'Michigan State',
    'Robotics',
    'Infrastructure',
    'Rust',
    'DSP',
    'Full-stack',
    'Portfolio',
  ],
  openGraph: {
    title: `${personal.name} — ${personal.role} @ ${personal.institution}`,
    description: personal.short,
    type: 'website',
    locale: 'en_US',
    url: 'https://ishan1522.github.io',
    siteName: `${personal.name} — ${personal.role}`,
    images: [
      {
        url: 'https://ishan1522.github.io/images/og.png',
        width: 1200,
        height: 630,
        alt: `${personal.name} — ${personal.role} @ ${personal.institution}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${personal.name}`,
    description: personal.short,
    images: ['https://ishan1522.github.io/images/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#090c16',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${jetbrains.variable}`}
    >
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
