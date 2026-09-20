import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Challenge, ChallengeSubmission } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ChallengesClient } from './ChallengesClient';
import { Rocket } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Weekly Challenges — Compete and Win XP | Decoding Tomorrow',
  description:
    'Take on weekly AI challenges. Submit your builds, vote on the best entries, and earn XP to climb the leaderboard. New challenges every week.',
  keywords: ['AI challenges', 'weekly challenges', 'coding challenge', 'AI competitions', 'win XP'],
  openGraph: {
    title: 'Weekly Challenges | Decoding Tomorrow',
    description:
      'Take on weekly AI challenges. Submit your builds, vote on the best entries, and earn XP.',
    type: 'website',
    url: `${SITE_URL}/challenges`,
  },
  alternates: { canonical: `${SITE_URL}/challenges` },
};

export default async function ChallengesPage() {
  const { data: challengesData } = await supabase
    .from('challenges')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  const challenges = (challengesData || []) as Challenge[];

  // Determine which challenges need submissions fetched (active + voting)
  const interactiveIds = challenges
    .filter((c) => c.status === 'active' || c.status === 'voting')
    .map((c) => c.id);

  let submissionsByChallenge: Record<string, ChallengeSubmission[]> = {};
  if (interactiveIds.length > 0) {
    const { data: submissionsData } = await supabase
      .from('challenge_submissions')
      .select('id, challenge_id, user_id, title, description, link_url, image_url, vote_count, is_winner, rank, created_at')
      .in('challenge_id', interactiveIds)
      .order('vote_count', { ascending: false });

    (submissionsData || []).forEach((sub) => {
      if (!submissionsByChallenge[sub.challenge_id]) {
        submissionsByChallenge[sub.challenge_id] = [];
      }
      submissionsByChallenge[sub.challenge_id].push(sub as ChallengeSubmission);
    });
  }

  // Attach submission counts + top submissions to each challenge
  const challengesWithSubs = challenges.map((c) => ({
    ...c,
    submission_count: submissionsByChallenge[c.id]?.length ?? c.submission_count,
    submissions: (submissionsByChallenge[c.id] || []).slice(0, 5),
  }));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Weekly AI Challenges',
    itemListElement: challenges.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/challenges#${c.slug}`,
      name: c.title,
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
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-5 h-5 text-brand-blue" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                Weekly Challenges
              </span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">
              Compete. Build. Win XP.
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Take on weekly AI challenges, submit your builds, and vote for the best entries.
              Climb the leaderboard and earn XP with every submission.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ChallengesClient challenges={challengesWithSubs as any} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
