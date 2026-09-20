'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FileText, Youtube, Cpu, Building2, Users, Mail, Eye,
  TrendingUp, MessageSquare, Star, ArrowUp, ArrowDown, Minus,
  Gamepad2, Trophy, FolderGit2, Target, Rocket, Vote, ChevronUp,
  Lightbulb, Activity, Zap, MousePointerClick,
} from 'lucide-react';

interface Stats {
  articles: number;
  videos: number;
  tools: number;
  companies: number;
  subscribers: number;
  comments: number;
  feedback: number;
  totalArticleViews: number;
  totalVideoViews: number;
  totalToolViews: number;
  totalCompanyViews: number;
}

interface TopItem {
  id: string;
  title?: string;
  name?: string;
  view_count: number;
  slug?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-2xl text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color.replace('text-', 'bg-')} bg-opacity-10`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="font-display font-bold text-lg text-white">{value.toLocaleString()}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function TopList({ title, items, icon: Icon }: { title: string; items: TopItem[]; icon: any }) {
  if (!items.length) return null;
  const max = items[0]?.view_count || 1;

  return (
    <div className="glass rounded-xl p-5">
      <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-blue" />
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const label = item.title || item.name || '—';
          const pct = max > 0 ? Math.round((item.view_count / max) * 100) : 0;
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-600 w-4 shrink-0">{i + 1}</span>
                  <span className="text-sm text-gray-300 truncate">{label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <Eye className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-400 font-medium">{item.view_count.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-blue to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topArticles, setTopArticles] = useState<TopItem[]>([]);
  const [topVideos, setTopVideos] = useState<TopItem[]>([]);
  const [topTools, setTopTools] = useState<TopItem[]>([]);
  const [topCompanies, setTopCompanies] = useState<TopItem[]>([]);
  const [recentSubs, setRecentSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0, totalXP: 0, gameSaves: 0, predictions: 0, predictionVotes: 0,
    projects: 0, projectUpvotes: 0, skillCompletions: 0, challengeSubs: 0, ideas: 0,
    activityItems: 0, notificationsSent: 0,
  });
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [communityClicks, setCommunityClicks] = useState({ discord: 0, reddit: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      const [
        { count: articleCount },
        { count: videoCount },
        { count: toolCount },
        { count: companyCount },
        { count: subCount },
        { count: commentCount },
        { count: feedbackCount },
        { data: articles },
        { data: videos },
        { data: tools },
        { data: companies },
        { data: subs },
        { count: userCount },
        { count: gameCount },
        { count: predCount },
        { count: predVoteCount },
        { count: projCount },
        { count: projUpvoteCount },
        { count: skillCompCount },
        { count: challSubCount },
        { count: ideaCount },
        { count: activityCount },
        { data: topProfiles },
      ] = await Promise.all([
        supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('ai_tools').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('is_confirmed', true),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('id, title, view_count, slug').eq('status', 'published').order('view_count', { ascending: false }).limit(7),
        supabase.from('videos').select('id, title, view_count').order('view_count', { ascending: false }).limit(7),
        supabase.from('ai_tools').select('id, name, view_count, slug').order('view_count', { ascending: false }).limit(7),
        supabase.from('companies').select('id, name, view_count, slug').order('view_count', { ascending: false }).limit(7),
        supabase.from('newsletter_subscribers').select('email, name, subscribed_at').order('subscribed_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('game_saves').select('*', { count: 'exact', head: true }),
        supabase.from('predictions').select('*', { count: 'exact', head: true }),
        supabase.from('prediction_votes').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('project_upvotes').select('*', { count: 'exact', head: true }),
        supabase.from('user_skill_progress').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('challenge_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('business_ideas').select('*', { count: 'exact', head: true }),
        supabase.from('activity_feed').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('username, xp, level, streak_days, reputation').order('xp', { ascending: false }).limit(10),
      ]);

      const sumViews = (arr: any[]) => (arr || []).reduce((s, r) => s + (r.view_count || 0), 0);

      setStats({
        articles: articleCount || 0,
        videos: videoCount || 0,
        tools: toolCount || 0,
        companies: companyCount || 0,
        subscribers: subCount || 0,
        comments: commentCount || 0,
        feedback: feedbackCount || 0,
        totalArticleViews: sumViews(articles || []),
        totalVideoViews: sumViews(videos || []),
        totalToolViews: sumViews(tools || []),
        totalCompanyViews: sumViews(companies || []),
      });
      setTopArticles(articles || []);
      setTopVideos(videos || []);
      setTopTools(tools || []);
      setTopCompanies(companies || []);
      setRecentSubs(subs || []);
      setPlatformStats({
        totalUsers: userCount || 0,
        totalXP: (topProfiles || []).reduce((s: number, u: any) => s + (u.xp || 0), 0),
        gameSaves: gameCount || 0,
        predictions: predCount || 0,
        predictionVotes: predVoteCount || 0,
        projects: projCount || 0,
        projectUpvotes: projUpvoteCount || 0,
        skillCompletions: skillCompCount || 0,
        challengeSubs: challSubCount || 0,
        ideas: ideaCount || 0,
        activityItems: activityCount || 0,
        notificationsSent: 0,
      });
      setTopUsers(topProfiles || []);

      const { data: clickData } = await supabase.from('community_clicks').select('platform');
      const discordClicks = (clickData || []).filter((c: any) => c.platform === 'discord').length;
      const redditClicks = (clickData || []).filter((c: any) => c.platform === 'reddit').length;
      setCommunityClicks({ discord: discordClicks, reddit: redditClicks, total: (clickData || []).length });

      setLoading(false);
    };
    load();
  }, []);

  const totalViews = stats
    ? stats.totalArticleViews + stats.totalVideoViews + stats.totalToolViews + stats.totalCompanyViews
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-white">Analytics</h1>
        <p className="text-gray-500 text-sm">Site-wide performance overview</p>
      </div>

      {/* Total views hero */}
      <div className="gradient-border rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <Eye className="w-7 h-7 text-brand-blue" />
          </div>
          <div>
            <div className="font-display font-bold text-4xl text-white">{totalViews.toLocaleString()}</div>
            <div className="text-gray-400 text-sm mt-1">Total page views across all content</div>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/8">
            {[
              { label: 'Articles', val: stats.totalArticleViews },
              { label: 'Videos', val: stats.totalVideoViews },
              { label: 'Tools', val: stats.totalToolViews },
              { label: 'Companies', val: stats.totalCompanyViews },
            ].map((x) => (
              <div key={x.label} className="text-center">
                <div className="font-bold text-xl text-white">{x.val.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{x.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Published Articles" value={stats?.articles ?? 0} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={Youtube} label="Videos" value={stats?.videos ?? 0} color="bg-red-500/10 text-red-400" />
        <StatCard icon={Cpu} label="AI Tools" value={stats?.tools ?? 0} color="bg-cyan-500/10 text-cyan-400" />
        <StatCard icon={Building2} label="Companies" value={stats?.companies ?? 0} color="bg-orange-500/10 text-orange-400" />
      </div>

      {/* Engagement stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Mail} label="Newsletter Subscribers" value={stats?.subscribers ?? 0} color="bg-green-500/10 text-green-400" />
        <StatCard icon={MessageSquare} label="Comments" value={stats?.comments ?? 0} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={Star} label="Feedback Submissions" value={stats?.feedback ?? 0} color="bg-yellow-500/10 text-yellow-400" />
      </div>

      {/* Top content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <TopList title="Top Articles by Views" items={topArticles} icon={FileText} />
        <TopList title="Top AI Tools by Views" items={topTools} icon={Cpu} />
        <TopList title="Top Videos by Views" items={topVideos} icon={Youtube} />
        <TopList title="Top Companies by Views" items={topCompanies} icon={Building2} />
      </div>

      {/* Platform Engagement Stats */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Interactive Platform</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat label="Total Users" value={platformStats.totalUsers} color="text-blue-400" icon={Users} />
          <MiniStat label="Game Saves" value={platformStats.gameSaves} color="text-green-400" icon={Gamepad2} />
          <MiniStat label="Predictions" value={platformStats.predictions} color="text-yellow-400" icon={Trophy} />
          <MiniStat label="Projects" value={platformStats.projects} color="text-purple-400" icon={FolderGit2} />
          <MiniStat label="Skill Completions" value={platformStats.skillCompletions} color="text-pink-400" icon={Target} />
          <MiniStat label="Challenge Subs" value={platformStats.challengeSubs} color="text-orange-400" icon={Rocket} />
          <MiniStat label="Prediction Votes" value={platformStats.predictionVotes} color="text-cyan-400" icon={Vote} />
          <MiniStat label="Project Upvotes" value={platformStats.projectUpvotes} color="text-green-400" icon={ChevronUp} />
          <MiniStat label="Business Ideas" value={platformStats.ideas} color="text-amber-400" icon={Lightbulb} />
          <MiniStat label="Activity Items" value={platformStats.activityItems} color="text-gray-400" icon={Activity} />
          <MiniStat label="Total XP" value={platformStats.totalXP} color="text-brand-blue" icon={Zap} />
        </div>
      </div>

      {/* Community Click Stats */}
      {communityClicks.total > 0 && (
        <div className="glass rounded-2xl border border-white/8 p-5 mb-8">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
            <MousePointerClick className="w-4 h-4 text-brand-blue" /> Community Button Clicks
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-white">{communityClicks.total}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total Clicks</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-[#5865F2]">{communityClicks.discord}</div>
              <div className="text-xs text-gray-500 mt-0.5">Discord Clicks</div>
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-2xl text-[#FF4500]">{communityClicks.reddit}</div>
              <div className="text-xs text-gray-500 mt-0.5">Reddit Clicks</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Users by XP */}
      {topUsers.length > 0 && (
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" /> Most Active Users (by XP)
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {topUsers.map((user, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                <span className={`text-sm font-bold w-6 shrink-0 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
                  {user.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{user.username || 'Unknown'}</p>
                  <p className="text-xs text-gray-600">Level {user.level || 1} · {user.streak_days || 0} day streak</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold text-brand-blue">{user.xp || 0}</span>
                  <span className="text-xs text-gray-600 ml-1">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent subscribers */}
      {recentSubs.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            Recent Subscribers
          </h3>
          <div className="space-y-2">
            {recentSubs.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-blue">
                    {(s.name || s.email)?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-white">{s.name || s.email}</div>
                    {s.name && <div className="text-xs text-gray-600">{s.email}</div>}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(s.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
