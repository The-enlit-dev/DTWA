import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CourseDetailClient from './CourseDetailClient';

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = `Course: ${params.slug.replace(/-/g, ' ')} | Decoding Tomorrow`;
  return {
    title,
    description: `Enroll in this free AI course on Decoding Tomorrow. Interactive lessons, quizzes, and a completion certificate.`,
    openGraph: {
      title,
      description: 'Free interactive AI course with lessons, quizzes, and a completion certificate.',
      type: 'article',
      url: `${SITE_URL}/courses/${params.slug}`,
      siteName: 'Decoding Tomorrow With Attharva',
    },
    alternates: { canonical: `${SITE_URL}/courses/${params.slug}` },
  };
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: params.slug.replace(/-/g, ' '),
    url: `${SITE_URL}/courses/${params.slug}`,
    provider: {
      '@type': 'Organization',
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
          <CourseDetailClient slug={params.slug} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
