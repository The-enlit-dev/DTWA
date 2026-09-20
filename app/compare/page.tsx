import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ToolComparison } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Scale, ArrowRight, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'AI Tool Comparisons — Head-to-Head Reviews',
  description:
    'Side-by-side comparisons of the best AI tools — feature tables, pros and cons, pricing, use cases, and an overall recommendation.',
  keywords: ['AI tool comparison', 'ChatGPT vs Claude', 'Gemini vs ChatGPT', 'Cursor vs Windsurf', 'AI tools review'],
  openGraph: {
    title: 'AI Tool Comparisons | Decoding Tomorrow With Attharva',
    description: 'Side-by-side comparisons of the best AI tools — features, pricing, pros, cons, and recommendations.',
    type: 'website',
    url: `${SITE_URL}/compare`,
  },
  twitter: { card: 'summary_large_image', title: 'AI Tool Comparisons | Decoding Tomorrow', description: 'Side-by-side AI tool reviews.' },
  alternates: { canonical: `${SITE_URL}/compare` },
};

async function getComparisons() {
  const { data } = await supabase
    .from('tool_comparisons')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);
  return (data || []) as ToolComparison[];
}

export default async function ComparePage() {
  const comparisons = await getComparisons();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Tool Comparisons',
    itemListElement: comparisons.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/compare/${c.slug}`,
      name: c.title,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-brand-blue" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Comparisons</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">AI Tool Comparisons</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Head-to-head reviews of the best AI tools — features, pricing, pros, cons, and a clear recommendation.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {comparisons.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No comparisons published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisons.map((c) => (
                <ComparisonCard key={c.id} comparison={c} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ComparisonCard({ comparison }: { comparison: ToolComparison }) {
  const timeAgo = comparison.published_at ? formatDistanceToNow(new Date(comparison.published_at), { addSuffix: true }) : '';
  const winnerLabel =
    comparison.winner === 'tool_a' ? comparison.tool_a :
    comparison.winner === 'tool_b' ? comparison.tool_b : 'Tie';

  return (
    <Link href={`/compare/${comparison.slug}`} className="group glass-hover rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="font-display font-bold text-lg text-white bg-brand-700/60 px-4 py-2 rounded-lg border border-white/8">
            {comparison.tool_a}
          </span>
          <span className="text-xs font-semibold text-gray-500 px-2 py-1 rounded bg-white/5">vs</span>
          <span className="font-display font-bold text-lg text-white bg-brand-700/60 px-4 py-2 rounded-lg border border-white/8">
            {comparison.tool_b}
          </span>
        </div>
        <h3 className="font-display font-bold text-white text-lg leading-tight mb-3 line-clamp-2 group-hover:text-blue-100 transition-colors">
          {comparison.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{comparison.summary}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500 pt-4 border-t border-white/8">
          <span className="text-brand-blue font-semibold">Winner: {winnerLabel}</span>
          <span className="ml-auto flex items-center gap-1"><Eye className="w-3 h-3" /> {comparison.view_count}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
