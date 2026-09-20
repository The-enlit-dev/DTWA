import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToolFinderClient from './ToolFinderClient';

export const metadata: Metadata = {
  title: 'AI Tool Finder — Find the Right AI Tool for You',
  description:
    'Answer 3 quick questions and get personalized AI tool recommendations tailored to your role, budget, and use case.',
  openGraph: {
    title: 'AI Tool Finder | Decoding Tomorrow With Attharva',
    description: 'Find your perfect AI tool in under a minute.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/tool-finder' },
};

export default function ToolFinderPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <ToolFinderClient />
      </main>
      <Footer />
    </div>
  );
}
