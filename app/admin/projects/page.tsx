'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  FolderGit2, Search, Star, Trash2, Eye, Archive, Loader2,
  TrendingUp, MessageCircle, ChevronUp, X, AlertTriangle, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type FilterTab = 'all' | 'published' | 'featured' | 'archived';

interface Project {
  id: string;
  title: string;
  slug: string;
  creator_id: string;
  upvote_count: number;
  comment_count: number;
  status: string;
  is_featured: boolean;
  created_at: string;
  profiles: { username: string | null; avatar_url: string | null } | null;
}

interface Stats {
  total: number;
  upvotes: number;
  comments: number;
  featured: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
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
      </div>
    </div>
  );
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'featured', label: 'Featured' },
  { key: 'archived', label: 'Archived' },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, upvotes: 0, comments: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const [
      { count: total },
      { count: upvotes },
      { count: comments },
      { count: featured },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('project_upvotes').select('*', { count: 'exact', head: true }),
      supabase.from('project_comments').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    ]);
    setStats({
      total: total || 0,
      upvotes: upvotes || 0,
      comments: comments || 0,
      featured: featured || 0,
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, profiles:creator_id(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(200);
    setProjects((data || []) as unknown as Project[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchProjects()]);
  }, [fetchStats, fetchProjects]);

  const toggleFeatured = async (p: Project) => {
    setBusyId(p.id);
    const next = !p.is_featured;
    await supabase.from('projects').update({ is_featured: next, updated_at: new Date().toISOString() }).eq('id', p.id);
    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_featured: next } : x)));
    setStats((s) => ({ ...s, featured: s.featured + (next ? 1 : -1) }));
    setBusyId(null);
  };

  const archiveProject = async (p: Project) => {
    if (p.status === 'archived') {
      if (!confirm(`Restore "${p.title}" to published status?`)) return;
    } else {
      if (!confirm(`Archive "${p.title}"? It will no longer be visible publicly.`)) return;
    }
    setBusyId(p.id);
    const next = p.status === 'archived' ? 'published' : 'archived';
    await supabase.from('projects').update({ status: next, updated_at: new Date().toISOString() }).eq('id', p.id);
    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    setBusyId(null);
  };

  const deleteProject = async (p: Project) => {
    if (!confirm(`Delete "${p.title}"? This will also remove all upvotes and comments. This cannot be undone.`)) return;
    setBusyId(p.id);
    await Promise.all([
      supabase.from('project_upvotes').delete().eq('project_id', p.id),
      supabase.from('project_comments').delete().eq('project_id', p.id),
    ]);
    await supabase.from('projects').delete().eq('id', p.id);
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
    setStats((s) => ({ ...s, total: s.total - 1, featured: p.is_featured ? s.featured - 1 : s.featured }));
    setBusyId(null);
  };

  const filtered = projects.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true
      : filter === 'published' ? p.status === 'published'
      : filter === 'featured' ? p.is_featured
      : filter === 'archived' ? p.status === 'archived'
      : true;
    return matchSearch && matchFilter;
  });

  const statusBadge = (status: string) => {
    if (status === 'archived')
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
          <Archive className="w-3 h-3" /> Archived
        </span>
      );
    if (status === 'published')
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
          <Check className="w-3 h-3" /> Published
        </span>
      );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 capitalize">
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-blue" /> Projects
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{stats.total} total projects</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FolderGit2} label="Total Projects" value={stats.total} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={TrendingUp} label="Total Upvotes" value={stats.upvotes.toLocaleString()} color="bg-green-500/10 text-green-400" />
        <StatCard icon={MessageCircle} label="Total Comments" value={stats.comments.toLocaleString()} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={Star} label="Featured Projects" value={stats.featured} color="bg-yellow-500/10 text-yellow-400" />
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-brand-800 border border-white/8 rounded-xl p-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count =
              tab.key === 'all' ? projects.length
              : tab.key === 'published' ? projects.filter((p) => p.status === 'published').length
              : tab.key === 'featured' ? projects.filter((p) => p.is_featured).length
              : projects.filter((p) => p.status === 'archived').length;
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
                <span className={`text-xs ${active ? 'text-white/70' : 'text-gray-600'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Creator</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Upvotes</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Comments</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500">
                      <FolderGit2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      No projects found.
                    </td>
                  </tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <FolderGit2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm text-white font-medium line-clamp-1">{p.title}</p>
                            {p.is_featured && (
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 font-mono mt-0.5">/projects#{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {p.profiles?.avatar_url ? (
                          <img src={p.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-blue">
                            {(p.profiles?.username || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-gray-300">{p.profiles?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <ChevronUp className="w-3.5 h-3.5 text-green-400" /> {p.upvote_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-500" /> {p.comment_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">
                        {p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleFeatured(p)}
                          disabled={busyId === p.id}
                          title={p.is_featured ? 'Unfeature' : 'Feature'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            p.is_featured
                              ? 'text-yellow-400 hover:bg-yellow-400/10'
                              : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                          }`}
                        >
                          {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${p.is_featured ? 'fill-yellow-400' : ''}`} />}
                        </button>
                        <a
                          href={`/projects#${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View project"
                          className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => archiveProject(p)}
                          disabled={busyId === p.id}
                          title={p.status === 'archived' ? 'Restore' : 'Archive'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            p.status === 'archived'
                              ? 'text-orange-400 hover:bg-orange-400/10'
                              : 'text-gray-500 hover:text-orange-400 hover:bg-orange-400/10'
                          }`}
                        >
                          {p.status === 'archived' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteProject(p)}
                          disabled={busyId === p.id}
                          title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
