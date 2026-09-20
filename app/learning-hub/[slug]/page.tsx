import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ResourceDetailClient from './ResourceDetailClient';

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = `Resource: ${params.slug.replace(/-/g, ' ')} | Decoding Tomorrow`;
  return {
    title,
    description: 'Download or view this AI learning resource from the Decoding Tomorrow Learning Hub.',
    openGraph: {
      title,
      description: 'Download or view this AI learning resource from the Decoding Tomorrow Learning Hub.',
      type: 'article',
      url: `${SITE_URL}/learning-hub/${params.slug}`,
      siteName: 'Decoding Tomorrow With Attharva',
    },
    alternates: { canonical: `${SITE_URL}/learning-hub/${params.slug}` },
  };
}

export default function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: params.slug.replace(/-/g, ' '),
    url: `${SITE_URL}/learning-hub/${params.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Decoding Tomorrow With Attharva',
      url: SITE_URL,
    },
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ResourceDetailClient slug={params.slug} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
