import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FeedbackClient from './FeedbackClient';

export const metadata: Metadata = {
  title: 'Feedback & Bug Reports',
  description: 'Share feedback, report bugs, or suggest new features for Decoding Tomorrow.',
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <FeedbackClient />
      </main>
      <Footer />
    </div>
  );
}
