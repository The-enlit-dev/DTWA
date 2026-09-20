import { supabase } from '@/lib/supabase';
import {
  Eye, FileText, MessageSquare, Mail, TrendingUp, Star, Building2,
  Cpu, Users, ArrowUpRight, Clock, BarChart2, Zap, BookOpen,
  Trophy, Rocket, Lightbulb, Home,
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 60;

async function getStats() {
  const [articlesRes, commentsRes, subscribersRes, toolsRes, companiesRes, videosRes, pendingRes, draftsRes, missingSeoRes, toolsNeedingReviewRes, openReportsRes] = await Promise.all([
    supabase.from('articles').select('id, title, view_count, status, like_count, created_at, seo_title, meta_description').eq('status', 'published').order('view_count', { ascending: false }).limit(20),
    supabase.from('comments').select('id, is_approved').eq('is_approved', false).limit(100),
    supabase.from('newsletter_subscribers').select('id').limit(1000),
    supabase.from('ai_tools').select('id, needs_review').limit(1000),
    supabase.from('companies').select('id').limit(1000),
    supabase.from('videos').select('id').limit(1000),
    supabase.from('articles').select('id').eq('status', 'pending').limit(100),
    supabase.from('articles').select('id').eq('status', 'draft').limit(100),
    supabase.from('articles').select('id, title').eq('status', 'published').or('seo_title.is.null,meta_description.is.null').limit(100),
    supabase.from('ai_tool_research').select('id').eq('needs_review', true).limit(100),
    supabase.from('content_reports').select('id').eq('status', 'open').limit(100),
  ]);

  const articles = articlesRes.data || [];
  const totalViews = articles.reduce((s, a) => s + a.view_count, 0);
  const totalLikes = articles.reduce((s, a) => s + a.like_count, 0);

  // Build recommendations
  const recommendations: { text: string; href: string; icon: string }[] = [];
  if ((draftsRes.data?.length || 0) > 0) recommendations.push({ text: `${draftsRes.data?.length} unpublished draft${(draftsRes.data?.length || 0) !== 1 ? 's' : ''} waiting to be published.`, href: '/admin/articles', icon: 'file' });
  if ((missingSeoRes.data?.length || 0) > 0) recommendations.push({ text: `${missingSeoRes.data?.length} article${(missingSeoRes.data?.length || 0) !== 1 ? 's' : ''} missing SEO metadata (title or description).`, href: '/admin/seo', icon: 'seo' });
  if ((toolsNeedingReviewRes.data?.length || 0) > 0) recommendations.push({ text: `${toolsNeedingReviewRes.data?.length} AI tool${(toolsNeedingReviewRes.data?.length || 0) !== 1 ? 's' : ''} need verification.`, href: '/admin/ai-researcher', icon: 'tool' });
  if ((openReportsRes.data?.length || 0) > 0) recommendations.push({ text: `${openReportsRes.data?.length} open content report${(openReportsRes.data?.length || 0) !== 1 ? 's' : ''} from visitors.`, href: '/admin/reports', icon: 'flag' });
  if ((pendingRes.data?.length || 0) > 0) recommendations.push({ text: `${pendingRes.data?.length} article${(pendingRes.data?.length || 0) !== 1 ? 's' : ''} pending review.`, href: '/admin/articles', icon: 'clock' });
  if ((commentsRes.data?.length || 0) > 0) recommendations.push({ text: `${commentsRes.data?.length} comment${(commentsRes.data?.length || 0) !== 1 ? 's' : ''} awaiting approval.`, href: '/admin/comments', icon: 'comment' });

  return {
    totalViews,
    totalLikes,
    articlesPublished: articles.length,
    pendingComments: commentsRes.data?.length || 0,
    subscribers: subscribersRes.data?.length || 0,
    toolsCount: toolsRes.data?.length || 0,
    companiesCount: companiesRes.data?.length || 0,
    videosCount: videosRes.data?.length || 0,
    pendingArticles: pendingRes.data?.length || 0,
    recentArticles: articles.slice(0, 6),
    recommendations,
  };
}

function formatCount(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ icon: Icon, label, value, sub, color, href, badge }: any) {
  return (
    <Link href={href || '#'} className="group glass rounded-2xl p-5 flex flex-col gap-3 border border-white/8 hover:border-white/18 transition-all hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge !== undefined && badge > 0 ? (
          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">{badge}</span>
        ) : (
          <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        )}
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-white leading-none">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </Link>
  );
}

const quickActions = [
  { href: '/admin/articles/new', icon: FileText, label: 'New Article', desc: 'Write & publish', color: 'text-brand-blue bg-brand-blue/12 border-brand-blue/25 hover:bg-brand-blue/20' },
  { href: '/admin/predictions', icon: Trophy, label: 'Predictions', desc: 'Create & resolve', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/18' },
  { href: '/admin/challenges', icon: Rocket, label: 'Challenges', desc: 'Set up weekly', color: 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/18' },
  { href: '/admin/ideas', icon: Lightbulb, label: 'Add Idea', desc: 'Business vault', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20 hover:bg-amber-400/18' },
  { href: '/admin/users', icon: Users, label: 'Users', desc: 'Manage accounts', color: 'text-green-400 bg-green-400/10 border-green-400/20 hover:bg-green-400/18' },
  { href: '/admin/homepage', icon: Home, label: 'Homepage', desc: 'Feature & banners', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 hover:bg-cyan-400/18' },
];

export default async function AdminDashboard() {
  const stats = await getStats();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Zap className="w-3.5 h-3.5 text-brand-blue" />
            <span>{greeting}, Admin</span>
            <span className="text-gray-700">·</span>
            <span>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Dashboard</h1>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 btn-gradient text-white text-sm font-semibold rounded-xl transition-all hover:opacity-90 shrink-0"
        >
          <FileText className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Alerts for pending items */}
      {(stats.pendingComments > 0 || stats.pendingArticles > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingComments > 0 && (
            <Link href="/admin/comments" className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/25 rounded-xl text-sm text-orange-400 hover:bg-orange-500/18 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span><strong>{stats.pendingComments}</strong> comment{stats.pendingComments !== 1 ? 's' : ''} awaiting approval</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {stats.pendingArticles > 0 && (
            <Link href="/admin/articles" className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/18 transition-colors">
              <Clock className="w-4 h-4" />
              <span><strong>{stats.pendingArticles}</strong> article{stats.pendingArticles !== 1 ? 's' : ''} pending review</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Primary stats */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Overview</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="Total Views" value={formatCount(stats.totalViews)} sub="Published articles" color="bg-brand-blue/15 border border-brand-blue/25 text-brand-blue" href="/admin/articles" />
          <StatCard icon={Mail} label="Subscribers" value={formatCount(stats.subscribers)} sub="Newsletter list" color="bg-pink-500/15 border border-pink-500/25 text-pink-400" href="/admin/newsletter" />
          <StatCard icon={Star} label="Total Likes" value={formatCount(stats.totalLikes)} sub="Across all articles" color="bg-yellow-500/15 border border-yellow-500/25 text-yellow-400" href="/admin/articles" />
          <StatCard icon={FileText} label="Published" value={stats.articlesPublished} sub="Articles live" color="bg-green-500/15 border border-green-500/25 text-green-400" href="/admin/articles" badge={stats.pendingComments} />
        </div>
      </div>

      {/* Content stats */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Content Library</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Cpu} label="AI Tools" value={stats.toolsCount} color="bg-brand-blue/12 border border-brand-blue/20 text-brand-blue" href="/admin/tools" />
          <StatCard icon={Building2} label="Companies" value={stats.companiesCount} color="bg-orange-500/12 border border-orange-500/20 text-orange-400" href="/admin/companies" />
          <StatCard icon={Eye} label="Videos" value={stats.videosCount} color="bg-red-500/12 border border-red-500/20 text-red-400" href="/admin/videos" />
        </div>
      </div>

      {/* What should I do next */}
      {stats.recommendations.length > 0 && (
        <div className="glass rounded-2xl border border-brand-blue/15 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" /> Recommended Next Actions
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {stats.recommendations.map((rec, i) => (
              <Link key={i} href={rec.href} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-300 flex-1">{rec.text}</p>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-blue transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Top articles */}
        <div className="lg:col-span-3 glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-blue" /> Top Performing Articles
            </h2>
            <Link href="/admin/articles" className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {stats.recentArticles.length === 0 && (
              <div className="px-5 py-10 text-center text-gray-500 text-sm">No published articles yet.</div>
            )}
            {stats.recentArticles.map((article, i) => (
              <div key={article.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors group">
                <span className={`text-sm font-bold w-6 shrink-0 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate leading-snug">{article.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(article.view_count)}</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />{article.like_count}</span>
                  </div>
                </div>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
                  className="text-xs text-gray-600 group-hover:text-brand-blue transition-colors shrink-0 flex items-center gap-1"
                >
                  Edit <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" /> Quick Actions
            </h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all hover:scale-[1.02] ${action.color}`}
              >
                <action.icon className="w-4 h-4" />
                <div>
                  <div className="text-xs font-semibold">{action.label}</div>
                  <div className="text-[10px] opacity-70">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
