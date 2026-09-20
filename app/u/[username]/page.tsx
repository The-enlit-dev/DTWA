import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/lib/supabase';
import { levelTitle, xpProgressInLevel, formatCount } from '@/lib/gamification';
import type { Profile, Project, Badge, UserBadge, ActivityItem, ChallengeSubmission, UserSkillProgress } from '@/lib/types';
import {
  Trophy,
  Flame,
  Zap,
  Star,
  Award,
  TrendingUp,
  Target,
  Rocket,
  Eye,
  Calendar,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Globe,
} from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.username);

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, is_public')
    .eq('username', username)
    .maybeSingle();

  if (!profile || !profile.is_public) {
    return {
      title: 'Profile not found | Decoding Tomorrow',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${profile.username} — Profile | Decoding Tomorrow`,
    description:
      profile.bio ||
      `View ${profile.username}'s profile on Decoding Tomorrow — projects, badges, XP, and activity.`,
    openGraph: {
      title: `${profile.username} — Profile | Decoding Tomorrow`,
      description:
        profile.bio ||
        `View ${profile.username}'s profile on Decoding Tomorrow.`,
      type: 'profile',
      url: `${SITE_URL}/u/${profile.username}`,
    },
    alternates: { canonical: `${SITE_URL}/u/${profile.username}` },
  };
}

export default async function UserProfilePage({ params }: Props) {
  const username = decodeURIComponent(params.username);

  // Fetch profile by username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (profileError || !profile || !(profile as Profile).is_public) {
    notFound();
  }

  const user = profile as Profile;
  const title = levelTitle(user.level);
  const progress = xpProgressInLevel(user.xp);
  const initial = (user.username || user.full_name || '?').charAt(0).toUpperCase();

  // Fetch user's projects
  const { data: projectsData } = await supabase
    .from('projects')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })
    .limit(6);
  const projects = (projectsData as Project[]) || [];

  // Fetch user's badges (join with badges table)
  const { data: userBadgesData } = await supabase
    .from('user_badges')
    .select('id, user_id, badge_id, earned_at, badges(*)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(12);
  const userBadges = (userBadgesData as unknown as (UserBadge & { badges: Badge })[]) || [];

  // Fetch user's challenge submissions
  const { data: submissionsData } = await supabase
    .from('challenge_submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);
  const submissions = (submissionsData as ChallengeSubmission[]) || [];

  // Fetch recent activity feed items
  const { data: activityData } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  const activity = (activityData as ActivityItem[]) || [];

  // Fetch user's skill progress (note: owner-only RLS — empty for other users)
  const { data: skillData } = await supabase
    .from('user_skill_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(20);
  const skills = (skillData as UserSkillProgress[]) || [];

  const socialLinks = [
    user.website ? { label: 'Website', url: user.website, icon: Globe } : null,
    user.twitter ? { label: 'Twitter', url: `https://twitter.com/${user.twitter}`, icon: Twitter } : null,
    user.github ? { label: 'GitHub', url: `https://github.com/${user.github}`, icon: Github } : null,
    user.linkedin ? { label: 'LinkedIn', url: `https://linkedin.com/in/${user.linkedin}`, icon: Linkedin } : null,
  ].filter(Boolean) as { label: string; url: string; icon: typeof Globe }[];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        {/* Hero / Header */}
        <div className="bg-brand-800/50 border-b border-white/6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shrink-0 shadow-brand">
                <span className="font-display font-bold text-4xl sm:text-5xl text-white">
                  {initial}
                </span>
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-1">
                  {user.username}
                </h1>
                <p className="text-brand-blue font-medium text-lg mb-3">{title}</p>

                {user.bio ? (
                  <p className="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-4">
                    {user.bio}
                  </p>
                ) : null}

                {/* Social links */}
                {socialLinks.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {socialLinks.map((s) => (
                      <a
                        key={s.label}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <s.icon className="w-4 h-4" />
                        {s.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Zap} label="Level" value={String(user.level)} accent="text-brand-blue" />
            <StatCard icon={Trophy} label="XP" value={formatCount(user.xp)} accent="text-yellow-400" />
            <StatCard icon={Flame} label="Streak" value={`${user.streak_days}d`} accent="text-orange-400" />
            <StatCard icon={Star} label="Reputation" value={formatCount(user.reputation)} accent="text-pink-400" />
          </div>
        </div>

        {/* XP progress bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress to Level {user.level + 1}</span>
              <span className="text-sm text-white font-medium">
                {progress.current} / {progress.needed} XP
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-purple"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: badges + activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Badges */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-400" />
                <h2 className="font-display font-bold text-xl text-white">Badges</h2>
                <span className="ml-auto text-sm text-gray-500">{userBadges.length}</span>
              </div>

              {userBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userBadges.map((ub) => {
                    const badge = ub.badges;
                    return (
                      <div
                        key={ub.id}
                        className="glass rounded-xl p-4 text-center"
                        style={{ borderColor: `${badge?.color || '#4A6CF7'}33` }}
                      >
                        <div
                          className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2"
                          style={{ background: `${badge?.color || '#4A6CF7'}22` }}
                        >
                          <Award className="w-5 h-5" style={{ color: badge?.color || '#4A6CF7' }} />
                        </div>
                        <p className="text-sm font-medium text-white truncate">{badge?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{badge?.description}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Award} text="No badges earned yet" />
              )}
            </section>

            {/* Recent activity */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-brand-blue" />
                <h2 className="font-display font-bold text-xl text-white">Recent Activity</h2>
              </div>

              {activity.length > 0 ? (
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="w-4 h-4 text-brand-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {a.link_url ? (
                          <Link
                            href={a.link_url}
                            className="text-sm text-white hover:text-brand-blue transition-colors"
                          >
                            {a.title}
                          </Link>
                        ) : (
                          <p className="text-sm text-white">{a.title}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {a.xp_earned > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                              <Zap className="w-3 h-3" />+{a.xp_earned} XP
                            </span>
                          ) : null}
                          <span className="text-xs text-gray-500">
                            {new Date(a.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={TrendingUp} text="No recent activity" />
              )}
            </section>
          </div>

          {/* Right column: projects + submissions + skills */}
          <div className="space-y-6">
            {/* Projects */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-green-400" />
                <h2 className="font-display font-bold text-lg text-white">Projects</h2>
                <span className="ml-auto text-sm text-gray-500">{projects.length}</span>
              </div>

              {projects.length > 0 ? (
                <ul className="space-y-3">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.slug}`}
                        className="group block glass-hover rounded-xl p-3"
                      >
                        <p className="text-sm font-medium text-white group-hover:text-brand-blue transition-colors truncate">
                          {p.title}
                        </p>
                        {p.tagline ? (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.tagline}</p>
                        ) : null}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {formatCount(p.upvote_count)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatCount(p.comment_count)}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Rocket} text="No projects yet" />
              )}
            </section>

            {/* Challenge submissions */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-pink-400" />
                <h2 className="font-display font-bold text-lg text-white">Challenges</h2>
                <span className="ml-auto text-sm text-gray-500">{submissions.length}</span>
              </div>

              {submissions.length > 0 ? (
                <ul className="space-y-3">
                  {submissions.map((s) => (
                    <li key={s.id} className="glass rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{s.title}</p>
                        {s.is_winner ? (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400 shrink-0">
                            <Trophy className="w-3 h-3" />Winner
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {formatCount(s.vote_count)} votes
                        </span>
                        {s.rank ? (
                          <span className="inline-flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            #{s.rank}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Target} text="No challenge submissions" />
              )}
            </section>

            {/* Skill progress summary */}
            <section className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h2 className="font-display font-bold text-lg text-white">Skills</h2>
                <span className="ml-auto text-sm text-gray-500">{skills.length}</span>
              </div>

              {skills.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    {skills.length} skill {skills.length === 1 ? 'node' : 'nodes'} completed
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.slice(0, 10).map((sk) => (
                      <span
                        key={sk.id}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300"
                      >
                        <Target className="w-3 h-3" />
                        Completed
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={Target} text="No skill progress visible" />
              )}
            </section>

            {/* Joined date */}
            <div className="glass rounded-2xl p-4 flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              Joined {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </div>

            {/* Link to leaderboard */}
            <Link
              href="/leaderboard"
              className="group glass-hover rounded-2xl p-4 flex items-center justify-between"
            >
              <span className="text-sm text-white">View Global Leaderboard</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${accent}`} />
      <p className="font-display font-bold text-xl text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Zap; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-600">
      <Icon className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
