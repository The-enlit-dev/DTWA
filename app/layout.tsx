import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import VisitorTracker from '@/components/VisitorTracker';
import CommandPalette from '@/components/CommandPalette';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const siteUrl = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Decoding Tomorrow With Attharva — AI, Business & Technology',
    template: '%s | Decoding Tomorrow With Attharva',
  },
  description:
    'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply. Think School meets TechCrunch.',
  keywords: [
    'AI',
    'artificial intelligence',
    'AI tools',
    'AI companies',
    'technology',
    'business',
    'future tech',
    'Decoding Tomorrow',
    'Attharva',
    'YouTube',
    'India AI',
    'tech analysis',
  ],
  authors: [{ name: 'Attharva', url: siteUrl }],
  creator: 'Attharva',
  publisher: 'Decoding Tomorrow With Attharva',
  category: 'Technology',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Decoding Tomorrow With Attharva',
    title: 'Decoding Tomorrow With Attharva — AI, Business & Technology',
    description:
      'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
    images: [
      {
        url: '/my_good_picture_for_pfp.png',
        width: 1200,
        height: 630,
        alt: 'Decoding Tomorrow With Attharva',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@decodingtomorrow',
    creator: '@decodingtomorrow',
    title: 'Decoding Tomorrow With Attharva — AI, Business & Technology',
    description:
      'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
    images: ['/my_good_picture_for_pfp.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: '7dffb64063d89a71',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#080c1a" />
        <link rel="apple-touch-icon" href="/my_good_picture_for_pfp.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7578411035985440"
          crossOrigin="anonymous"
        ></script>
        <script src="https://d2m0q4mqi7nqzy.cloudfront.net/integration-scripts/main-embed-loader.js" data-api-key="vy_4ba4b3f82c154423b66ec0bc876adf53" data-bot-url="https://dev.dr052qf743xkr.amplifyapp.com/" data-api="aHR0cHM6Ly93YjFiem41MHNpLmV4ZWN1dGUtYXBpLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9hcGk="></script>
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-brand-900 text-white min-h-screen`}
      >
        {children}
        <VisitorTracker />
        <CommandPalette />
        <Script src="https://d2m0q4mqi7nqzy.cloudfront.net/integration-scripts/main.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
