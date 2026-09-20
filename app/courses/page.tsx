import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CoursesClient from './CoursesClient';

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Courses | Decoding Tomorrow With Attharva',
  description:
    'Learn AI through free interactive courses with video lessons, quizzes, hands-on projects, and completion certificates. Track your progress and level up your AI skills.',
  openGraph: {
    title: 'Interactive Courses | Decoding Tomorrow With Attharva',
    description:
      'Learn AI through free interactive courses with video lessons, quizzes, and completion certificates.',
    type: 'website',
    url: `${SITE_URL}/courses`,
    siteName: 'Decoding Tomorrow With Attharva',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interactive Courses | Decoding Tomorrow With Attharva',
    description: 'Learn AI through free interactive courses with quizzes and certificates.',
  },
  alternates: { canonical: `${SITE_URL}/courses` },
  keywords: ['AI courses', 'free AI courses', 'learn AI online', 'machine learning course', 'deep learning course', 'AI certification'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Interactive Courses',
  description: 'Free interactive AI courses with video lessons, quizzes, and completion certificates.',
  url: `${SITE_URL}/courses`,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Decoding Tomorrow With Attharva',
    url: SITE_URL,
  },
};

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <CoursesClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
