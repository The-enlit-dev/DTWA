import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Prediction, PredictionVote } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PredictionsClient } from './PredictionsClient';
import { Trophy, TrendingUp } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Future Prediction Market — Forecast the AI Future',
  description:
    'Predict AGI timelines, AI company valuations, job displacement, and model capabilities. Vote, see community consensus, and build your accuracy score.',
  keywords: ['AI predictions', 'AGI timeline', 'prediction market', 'AI future', 'forecast AI'],
  openGraph: {
    title: 'Future Prediction Market | Decoding Tomorrow',
    description: 'Forecast the future of AI. Vote, see consensus, and build your accuracy score.',
    type: 'website',
    url: `${SITE_URL}/predictions`,
  },
  alternates: { canonical: `${SITE_URL}/predictions` },
};

export interface ReasoningSnippet {
  username: string;
  vote_value: string;
  reasoning: string;
  created_at: string;
}

async function getData() {
  const [predRes, votesRes, reasoningRes] = await Promise.all([
    supabase.from('predictions').select('*').order('is_trending', { ascending: false }).order('vote_count', { ascending: false }),
    supabase.from('prediction_votes').select('prediction_id, vote_value, user_id, reasoning'),
    // Recent reasoning snippets with username, limited per prediction in JS below.
    supabase
      .from('prediction_votes')
      .select('prediction_id, vote_value, reasoning, created_at, profiles!inner(username)')
      .not('reasoning', 'is', null)
      .neq('reasoning', '')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const predictions = (predRes.data || []) as Prediction[];
  const votes = (votesRes.data || []) as (PredictionVote & { reasoning: string | null })[];

  // Compute consensus for each prediction
  const predictionsWithConsensus = predictions.map((p) => {
    const predVotes = votes.filter((v) => v.prediction_id === p.id);
    const tally: Record<string, number> = {};
    predVotes.forEach((v) => { tally[v.vote_value] = (tally[v.vote_value] || 0) + 1; });
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    // Up to 3 most recent reasoning snippets for this prediction
    const snippets: ReasoningSnippet[] = (reasoningRes.data || [])
      .filter((r: any) => r.prediction_id === p.id)
      .slice(0, 3)
      .map((r: any) => ({
        username: r.profiles?.username ?? 'anonymous',
        vote_value: r.vote_value,
        reasoning: r.reasoning,
        created_at: r.created_at,
      }));

    return {
      ...p,
      voteTally: tally,
      totalVotes: predVotes.length,
      topVote: sorted[0] || null,
      reasoningSnippets: snippets,
    };
  });

  return { predictions: predictionsWithConsensus };
}

export default async function PredictionsPage() {
  const { predictions } = await getData();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Future Predictions',
    itemListElement: predictions.map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/predictions#${p.slug}`, name: p.title,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Prediction Market</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">Forecast the AI Future</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Predict AGI timelines, valuations, and AI industry outcomes. See what the community thinks and build your accuracy score.
            </p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <PredictionsClient predictions={predictions as any} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
