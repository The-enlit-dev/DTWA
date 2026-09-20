import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { BusinessIdea } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { IdeasClient } from './IdeasClient';
import { Lightbulb, TrendingUp } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'AI Business Ideas Vault — Startup Ideas with Market Sizes',
  description:
    'Explore curated AI business ideas with market sizes, monetization models, tech stacks, and difficulty ratings. Search, filter, rate, and bookmark your next startup idea.',
  keywords: [
    'AI business ideas',
    'startup ideas',
    'AI startup',
    'business ideas vault',
    'AI monetization',
    'SaaS ideas',
    'AI product ideas',
  ],
  openGraph: {
    title: 'AI Business Ideas Vault | Decoding Tomorrow',
    description:
      'Curated AI startup ideas with market sizes, monetization models, and tech stacks. Rate and bookmark ideas you love.',
    type: 'website',
    url: `${SITE_URL}/ideas`,
  },
  alternates: { canonical: `${SITE_URL}/ideas` },
};

async function getData() {
  const { data, error } = await supabase
    .from('business_ideas')
    .select('*')
    .order('rating_sum', { ascending: false });

  if (error) {
    console.error('Failed to fetch business_ideas:', error.message);
    return { ideas: [] as BusinessIdea[] };
  }
  return { ideas: (data || []) as BusinessIdea[] };
}

export default async function IdeasPage() {
  const { ideas } = await getData();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Business Ideas Vault',
    itemListElement: ideas.map((idea, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/ideas#${idea.slug}`,
      name: idea.title,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-brand-blue" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                Business Ideas Vault
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">
              AI Business Ideas Vault
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Curated AI startup ideas with market sizes, monetization models, and tech stacks.
              Find your next venture, rate the ones you love, and bookmark ideas for later.
            </p>
            <div className="flex items-center gap-4 mt-5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> {ideas.length} ideas
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <IdeasClient ideas={ideas} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
