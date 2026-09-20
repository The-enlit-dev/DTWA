import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { AiTool, Company } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our AI Tools & Company Reviews',
  description:
    "Attharva's honest reviews of AI tools and deep-dive company profiles — ratings, pros & cons, funding, and everything you need to know.",
  openGraph: {
    title: 'Our AI Tools & Company Reviews | Decoding Tomorrow With Attharva',
    description:
      "Honest reviews of AI tools and deep-dive company profiles from Decoding Tomorrow.",
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/reviews' },
};

async function getData() {
  const [{ data: tools }, { data: companies }] = await Promise.all([
    supabase.from('ai_tools').select('*').order('rating', { ascending: false }).limit(200),
    supabase.from('companies').select('*').order('view_count', { ascending: false }).limit(200),
  ]);
  return {
    tools: (tools || []) as AiTool[],
    companies: (companies || []) as Company[],
  };
}

export default async function ReviewsPage() {
  const { tools, companies } = await getData();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="bg-brand-800/50 border-b border-white/6 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                Reviewed by Attharva
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4 leading-tight">
                Our AI Tools &amp;<br />Company Reviews
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Honest, in-depth reviews of the AI tools I&apos;ve actually tested — plus deep profiles on the
                companies building the future. No fluff, just what matters.
              </p>
              <div className="flex items-center gap-6 mt-6">
                <div className="text-center">
                  <div className="font-display font-bold text-2xl text-white">{tools.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tool Reviews</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="font-display font-bold text-2xl text-white">{companies.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Company Profiles</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ReviewsClient tools={tools} companies={companies} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
