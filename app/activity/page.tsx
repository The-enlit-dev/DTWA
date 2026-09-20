import { Metadata } from 'next';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import type { ActivityItem, Profile } from '@/lib/types';
import { Zap, TrendingUp, Activity as ActivityIcon } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Activity Feed — Community Pulse | Decoding Tomorrow',
  description:
    'The latest activity from the Decoding Tomorrow community — projects shipped, badges earned, challenges won, and XP gained in real time.',
  keywords: ['activity feed', 'community', 'latest activity', 'gamification', 'XP'],
  openGraph: {
    title: 'Activity Feed | Decoding Tomorrow With Attharva',
    description:
      'See what the community is building, earning, and achieving in real time.',
    type: 'website',
    url: `${SITE_URL}/activity`,
  },
  alternates: { canonical: `${SITE_URL}/activity` },
};

type ProfileRef = { username: string; avatar_url: string };
type ActivityWithProfile = ActivityItem & {
  // Supabase types a belongsTo relation as an array; at runtime it is usually a
  // single object. Normalize via the helper below so both shapes are handled.
  profiles: ProfileRef[] | ProfileRef | null;
};

function profileUsername(a: ActivityWithProfile): string {
  const p = a.profiles;
  if (!p) return 'Unknown';
  if (Array.isArray(p)) return p[0]?.username || 'Unknown';
  return p.username || 'Unknown';
}

export default async function ActivityPage() {
  // Fetch latest 50 activity_feed items joined with profiles
  const { data: activityData } = await supabase
    .from('activity_feed')
    .select('id, user_id, type, title, description, link_url, metadata, xp_earned, created_at, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(50);
  const activity = (activityData as ActivityWithProfile[]) || [];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Header */}
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue text-xs font-medium mb-4">
              <ActivityIcon className="w-3.5 h-3.5" />
              Community Pulse
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-3">
              <span className="gradient-text">Activity Feed</span>
            </h1>
            <p className="text-gray-400 text-lg">
              See what the community is building, earning, and achieving — in real time.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {activity.length > 0 ? (
            <>
              {/* Timeline */}
              <ol className="relative space-y-4">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" aria-hidden="true" />

                {activity.map((a) => {
                  const username = profileUsername(a);
                  const initial = username.charAt(0).toUpperCase();
                  const xp = a.xp_earned || 0;

                  return (
                    <li key={a.id} className="relative pl-14">
                      {/* Avatar node */}
                      <Link
                        href={`/u/${username}`}
                        className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center ring-4 ring-brand-900 shrink-0 hover:scale-105 transition-transform"
                      >
                        <span className="font-display font-bold text-sm text-white">{initial}</span>
                      </Link>

                      {/* Card */}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                              <Link
                                href={`/u/${username}`}
                                className="text-gray-400 hover:text-brand-blue transition-colors font-medium"
                              >
                                {username}
                              </Link>
                              <span>·</span>
                              <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                            </div>

                            {a.link_url ? (
                              <Link
                                href={a.link_url}
                                className="text-sm text-white hover:text-brand-blue transition-colors leading-snug"
                              >
                                {a.title}
                              </Link>
                            ) : (
                              <p className="text-sm text-white leading-snug">{a.title}</p>
                            )}

                            {a.description ? (
                              <p className="text-xs text-gray-500 mt-1 leading-snug">{a.description}</p>
                            ) : null}
                          </div>

                          {/* XP badge */}
                          {xp > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shrink-0">
                              <Zap className="w-3 h-3" />
                              +{xp} XP
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Footer link */}
              <div className="mt-8 text-center">
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-brand-blue" />
                  See how these players rank on the leaderboard
                </Link>
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <ActivityIcon className="w-12 h-12 mx-auto mb-4 text-gray-700" />
              <h2 className="font-display font-bold text-xl text-white mb-2">No activity yet</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                The community activity feed will light up as soon as members start earning XP,
                shipping projects, and completing challenges.
              </p>
              <Link
                href="/play"
                className="inline-flex items-center gap-2 text-sm text-brand-blue hover:text-blue-300 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Start earning XP
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
