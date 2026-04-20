import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { personal } from '@/data/personal';

// Distinctive fonts — IBM Plex for scientific/engineering heritage,
// JetBrains Mono for the technical accents. Loaded via next/font so
// they're self-hosted and zero-FOUT.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-plex-condensed',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    'Neuroscience',
    'Green AI',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: `${personal.name}`,
    description: personal.short,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexCondensed.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
