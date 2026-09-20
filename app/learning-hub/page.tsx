import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LearningHubClient from './LearningHubClient';

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Learning Hub | Decoding Tomorrow With Attharva',
  description:
    'Explore a curated library of AI resources — PDFs, study notes, cheat sheets, guides, and research papers. Download, view online, and learn AI at your own pace.',
  openGraph: {
    title: 'Learning Hub | Decoding Tomorrow With Attharva',
    description:
      'Explore a curated library of AI resources — PDFs, study notes, cheat sheets, guides, and research papers.',
    type: 'website',
    url: `${SITE_URL}/learning-hub`,
    siteName: 'Decoding Tomorrow With Attharva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learning Hub | Decoding Tomorrow With Attharva',
    description: 'Explore a curated library of AI resources.',
  },
  alternates: { canonical: `${SITE_URL}/learning-hub` },
  keywords: ['AI learning resources', 'AI PDF', 'AI study notes', 'AI cheat sheets', 'machine learning guides', 'AI research papers'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Learning Hub',
  description: 'A curated library of AI resources — PDFs, study notes, cheat sheets, guides, and research papers.',
  url: `${SITE_URL}/learning-hub`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Decoding Tomorrow With Attharva',
    url: SITE_URL,
  },
};

export default function LearningHubPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LearningHubClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
