import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { levelTitle, formatMoney, formatCount } from '@/lib/gamification';
import type { Profile, LeaderboardEntry } from '@/lib/types';
import { Trophy, Flame, Zap, Star, Gamepad2, TrendingUp } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Leaderboard — Top Players & Builders | Decoding Tomorrow',
  description:
    'Climb the Decoding Tomorrow leaderboards. See the top players by XP and the highest scores in the AI Startup Simulator.',
  keywords: ['leaderboard', 'XP ranking', 'simulator scores', 'top players', 'gamification'],
  openGraph: {
    title: 'Leaderboard | Decoding Tomorrow With Attharva',
    description:
      'See the top players, builders, and predictors. Climb the ranks by XP and simulator score.',
    type: 'website',
    url: `${SITE_URL}/leaderboard`,
  },
  alternates: { canonical: `${SITE_URL}/leaderboard` },
};

const RANK_STYLES: Record<number, { ring: string; text: string; glow: string; medal: string }> = {
  1: { ring: 'ring-2 ring-yellow-400/60', text: 'text-yellow-400', glow: 'shadow-[0_0_30px_rgba(250,204,21,0.25)]', medal: '🥇' },
  2: { ring: 'ring-2 ring-gray-300/60', text: 'text-gray-300', glow: 'shadow-[0_0_30px_rgba(203,213,225,0.2)]', medal: '🥈' },
  3: { ring: 'ring-2 ring-orange-500/60', text: 'text-orange-400', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.2)]', medal: '🥉' },
};

function rankStyle(rank: number) {
  return RANK_STYLES[rank] || null;
}

export default async function LeaderboardPage() {
  // Fetch top 50 public profiles ordered by xp DESC
  const { data: xpData } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, xp, level, streak_days, reputation')
    .eq('is_public', true)
    .order('xp', { ascending: false })
    .limit(50);
  const xpLeaders = (xpData as Profile[]) || [];

  // Fetch game_leaderboard view data (simulator scores)
  const { data: simData } = await supabase
    .from('game_leaderboard')
    .select('*')
    .limit(50);
  const simLeaders = (simData as LeaderboardEntry[]) || [];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-4">
              <Trophy className="w-3.5 h-3.5" />
              Global Rankings
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-3">
              <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              The top builders, predictors, and founders on Decoding Tomorrow. Climb the ranks by
              earning XP and dominating the AI Startup Simulator.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* XP Leaderboard */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white">XP Leaderboard</h2>
                  <p className="text-xs text-gray-500">Top 50 by experience points</p>
                </div>
              </div>

              {xpLeaders.length > 0 ? (
                <ul className="space-y-2">
                  {xpLeaders.map((p, i) => {
                    const rank = i + 1;
                    const style = rankStyle(rank);
                    const title = levelTitle(p.level);
                    return (
                      <li key={p.id}>
                        <Link
                          href={`/u/${p.username}`}
                          className={`group glass-hover rounded-xl p-3 flex items-center gap-3 ${style?.ring || ''} ${style?.glow || ''}`}
                        >
                          {/* Rank */}
                          <div className={`w-8 text-center font-display font-bold text-lg shrink-0 ${style?.text || 'text-gray-500'}`}>
                            {rank <= 3 ? style!.medal : rank}
                          </div>

                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shrink-0">
                            <span className="font-display font-bold text-white">
                              {(p.username || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Identity */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-brand-blue transition-colors">
                              {p.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{title}</p>
                          </div>

                          {/* XP */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-yellow-400">{formatCount(p.xp)}</p>
                            <p className="text-xs text-gray-500">XP · Lv {p.level}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Zap className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">No players ranked yet</p>
                </div>
              )}
            </section>

            {/* Simulator Leaderboard */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-white">Simulator Leaderboard</h2>
                  <p className="text-xs text-gray-500">Top founders by final score</p>
                </div>
              </div>

              {simLeaders.length > 0 ? (
                <ul className="space-y-2">
                  {simLeaders.map((e, i) => {
                    const rank = i + 1;
                    const style = rankStyle(rank);
                    return (
                      <li key={`${e.user_id}-${i}`}>
                        <Link
                          href={e.username ? `/u/${e.username}` : '#'}
                          className={`group glass-hover rounded-xl p-3 flex items-center gap-3 ${style?.ring || ''} ${style?.glow || ''}`}
                        >
                          {/* Rank */}
                          <div className={`w-8 text-center font-display font-bold text-lg shrink-0 ${style?.text || 'text-gray-500'}`}>
                            {rank <= 3 ? style!.medal : rank}
                          </div>

                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shrink-0">
                            <span className="font-display font-bold text-white">
                              {(e.username || e.company_name || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Identity */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-brand-blue transition-colors">
                              {e.company_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {e.username ? `by ${e.username}` : e.industry}
                              {e.funding_stage ? ` · ${e.funding_stage}` : ''}
                            </p>
                          </div>

                          {/* Score + valuation */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-green-400">{formatCount(e.final_score)}</p>
                            <p className="text-xs text-gray-500">{formatMoney(e.valuation)}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Gamepad2 className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">No simulator runs completed yet</p>
                  <Link
                    href="/simulator"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-blue hover:text-blue-300 transition-colors"
                  >
                    Play the simulator <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Summary footer */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={Trophy}
              label="XP Tracked"
              value={xpLeaders.length > 0 ? formatCount(xpLeaders[0].xp) : '0'}
              sub="Top player"
            />
            <SummaryCard
              icon={Gamepad2}
              label="Sim Runs"
              value={String(simLeaders.length)}
              sub="Completed games"
            />
            <SummaryCard
              icon={Star}
              label="Highest Valuation"
              value={simLeaders.length > 0 ? formatMoney(simLeaders[0].valuation) : '$0'}
              sub="Simulator"
            />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              Start earning XP and climb the ranks
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="glass rounded-xl p-5 text-center">
      <Icon className="w-5 h-5 mx-auto mb-2 text-brand-blue" />
      <p className="font-display font-bold text-2xl text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
    </div>
  );
}
