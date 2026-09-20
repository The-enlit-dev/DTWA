import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CommunityClient from './CommunityClient';

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Community | Decoding Tomorrow With Attharva',
  description:
    'Join the Decoding Tomorrow community — a vibrant group of AI enthusiasts, builders, and learners. Connect on Discord and Reddit to learn AI, discover tools, ask questions, share projects, and stay updated.',
  openGraph: {
    title: 'Join the Decoding Tomorrow Community | Discord & Reddit',
    description:
      'Connect with 1,000+ AI enthusiasts. Learn AI, discover tools, ask questions, share projects, discuss careers, and stay updated on AI news.',
    type: 'website',
    url: `${SITE_URL}/community`,
    siteName: 'Decoding Tomorrow With Attharva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the Decoding Tomorrow Community',
    description: 'Connect with 1,000+ AI enthusiasts on Discord and Reddit.',
  },
  alternates: { canonical: `${SITE_URL}/community` },
  keywords: ['AI community', 'Discord AI', 'Reddit AI', 'AI tools community', 'learn AI online', 'AI builders community'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Community',
  name: 'Decoding Tomorrow Community',
  description:
    'A community of AI enthusiasts, builders, and learners. Connect on Discord and Reddit to learn AI, discover tools, ask questions, share projects, and stay updated on AI news.',
  url: `${SITE_URL}/community`,
  parentOrganization: {
    '@type': 'Organization',
    name: 'Decoding Tomorrow With Attharva',
    url: SITE_URL,
  },
  sameAs: [
    'https://discord.gg/decodingtomorrow',
    'https://www.reddit.com/r/DecodingTomorrow',
  ],
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CommunityClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
