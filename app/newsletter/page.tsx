import { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import NewsletterSignupPage from './NewsletterSignupPage';

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Subscribe to the Decoding Tomorrow newsletter — weekly AI insights.',
};

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <NewsletterSignupPage />
      </main>
      <Footer />
    </div>
  );
}
