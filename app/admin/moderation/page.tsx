'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Shield, Search, Trash2, Eye, Loader2, Check, X, AlertTriangle,
  Flag, MessageSquare, FolderGit2, Rocket, Clock, Archive,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
type ContentTab = 'projects' | 'comments' | 'submissions';
type StatusFilter = 'all' | ReportStatus;

interface ContentReport {
  id: string;
  reporter_id: string | null;
  content_type: string;
  content_id: string;
  reason: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
  reporter: { username: string | null } | null;
}

interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  creator_id: string | null;
  upvote_count: number;
  status: string;
  profiles: { username: string | null } | null;
}

interface CommentRow {
  id: string;
  project_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  projects: { title: string | null } | null;
  profiles: { username: string | null } | null;
}

interface SubmissionRow {
  id: string;
  challenge_id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  challenges: { title: string | null } | null;
  profiles: { username: string | null } | null;
}

interface ModStats {
  pending: number;
  resolved: number;
  totalReports: number;
  moderatedItems: number;
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

const contentTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  project: { label: 'Project', icon: FolderGit2, color: 'text-brand-blue bg-brand-blue/15' },
  comment: { label: 'Comment', icon: MessageSquare, color: 'text-purple-400 bg-purple-400/15' },
  submission: { label: 'Submission', icon: Rocket, color: 'text-green-400 bg-green-400/15' },
  article: { label: 'Article', icon: AlertTriangle, color: 'text-orange-400 bg-orange-400/15' },
};

const statusBadge = (status: ReportStatus) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case 'reviewing':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
          <Eye className="w-3 h-3" /> Reviewing
        </span>
      );
    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
          <Check className="w-3 h-3" /> Resolved
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400">
          <X className="w-3 h-3" /> Dismissed
        </span>
      );
    default:
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 capitalize">
          {status}
        </span>
      );
  }
};

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
];

const CONTENT_TABS: { key: ContentTab; label: string; icon: any }[] = [
  { key: 'projects', label: 'Projects', icon: FolderGit2 },
  { key: 'comments', label: 'Project Comments', icon: MessageSquare },
  { key: 'submissions', label: 'Challenge Submissions', icon: Rocket },
];

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [stats, setStats] = useState<ModStats>({ pending: 0, resolved: 0, totalReports: 0, moderatedItems: 0 });
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [contentTab, setContentTab] = useState<ContentTab>('projects');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('content_reports')
      .select('*, reporter:reporter_id(username)')
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200);
    setReports((data || []) as unknown as ContentReport[]);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [
      { count: totalReports },
      { count: pending },
      { count: resolved },
      { count: projectCount },
      { count: commentCount },
      { count: submissionCount },
    ] = await Promise.all([
      supabase.from('content_reports').select('*', { count: 'exact', head: true }),
      supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('project_comments').select('*', { count: 'exact', head: true }),
      supabase.from('challenge_submissions').select('*', { count: 'exact', head: true }),
    ]);
    setStats({
      totalReports: totalReports || 0,
      pending: pending || 0,
      resolved: resolved || 0,
      moderatedItems: (projectCount || 0) + (commentCount || 0) + (submissionCount || 0),
    });
  }, []);

  const fetchProjects = useCallback(async () => {
    setTabLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('id, title, slug, creator_id, upvote_count, status, profiles:creator_id(username)')
      .order('created_at', { ascending: false })
      .limit(200);
    setProjects((data || []) as unknown as ProjectRow[]);
    setTabLoading(false);
  }, []);

  const fetchComments = useCallback(async () => {
    setTabLoading(true);
    const { data } = await supabase
      .from('project_comments')
      .select('id, project_id, user_id, content, created_at, projects:project_id(title), profiles:user_id(username)')
      .order('created_at', { ascending: false })
      .limit(200);
    setComments((data || []) as unknown as CommentRow[]);
    setTabLoading(false);
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setTabLoading(true);
    const { data } = await supabase
      .from('challenge_submissions')
      .select('id, challenge_id, user_id, title, created_at, challenges:challenge_id(title), profiles:user_id(username)')
      .order('created_at', { ascending: false })
      .limit(200);
    setSubmissions((data || []) as unknown as SubmissionRow[]);
    setTabLoading(false);
  }, []);

  useEffect(() => {
    Promise.all([fetchReports(), fetchStats(), fetchProjects()]);
  }, [fetchReports, fetchStats, fetchProjects]);

  useEffect(() => {
    if (contentTab === 'comments') fetchComments();
    else if (contentTab === 'submissions') fetchSubmissions();
    else if (contentTab === 'projects' && projects.length === 0) fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTab]);

  /* ---------------- Report actions ---------------- */
  const markReviewing = async (id: string) => {
    setBusyId(id);
    await supabase.from('content_reports').update({ status: 'reviewing' }).eq('id', id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'reviewing' } : r)));
    setStats((s) => ({ ...s, pending: s.pending - 1 }));
    setBusyId(null);
  };

  const resolveReport = async (id: string) => {
    const note = prompt('Add a resolution note (optional):', '') ?? '';
    setBusyId(id);
    await supabase
      .from('content_reports')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      })
      .eq('id', id);
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'resolved', resolved_at: new Date().toISOString(), resolution_note: note }
          : r,
      ),
    );
    setStats((s) => ({
      ...s,
      pending: r_statusWasPending(reports, id) ? s.pending - 1 : s.pending,
      resolved: s.resolved + 1,
    }));
    setBusyId(null);
  };

  const dismissReport = async (id: string) => {
    setBusyId(id);
    await supabase.from('content_reports').update({ status: 'dismissed' }).eq('id', id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r)));
    setStats((s) => ({
      ...s,
      pending: r_statusWasPending(reports, id) ? s.pending - 1 : s.pending,
    }));
    setBusyId(null);
  };

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report permanently? This cannot be undone.')) return;
    setBusyId(id);
    const wasPending = r_statusWasPending(reports, id);
    const wasResolved = r_statusWasResolved(reports, id);
    await supabase.from('content_reports').delete().eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    setStats((s) => ({
      ...s,
      totalReports: s.totalReports - 1,
      pending: wasPending ? s.pending - 1 : s.pending,
      resolved: wasResolved ? s.resolved - 1 : s.resolved,
    }));
    setBusyId(null);
  };

  /* ---------------- Content quick-remove ---------------- */
  const archiveProject = async (p: ProjectRow) => {
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

  const deleteProject = async (p: ProjectRow) => {
    if (!confirm(`Delete "${p.title}"? This will also remove related upvotes and comments. This cannot be undone.`)) return;
    setBusyId(p.id);
    await Promise.all([
      supabase.from('project_upvotes').delete().eq('project_id', p.id),
      supabase.from('project_comments').delete().eq('project_id', p.id),
    ]);
    await supabase.from('projects').delete().eq('id', p.id);
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
    setBusyId(null);
  };

  const deleteComment = async (c: CommentRow) => {
    if (!confirm('Delete this comment? This cannot be undone.')) return;
    setBusyId(c.id);
    await supabase.from('project_comments').delete().eq('id', c.id);
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    setBusyId(null);
  };

  const deleteSubmission = async (s: SubmissionRow) => {
    if (!confirm(`Delete submission "${s.title}"? This cannot be undone.`)) return;
    setBusyId(s.id);
    await supabase.from('challenge_submissions').delete().eq('id', s.id);
    setSubmissions((prev) => prev.filter((x) => x.id !== s.id));
    setBusyId(null);
  };

  const projectStatusBadge = (status: string) => {
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
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 capitalize">{status}</span>
    );
  };

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      !search ||
      r.content_type.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      (r.reporter?.username || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countFor = (key: StatusFilter) =>
    key === 'all' ? reports.length : reports.filter((r) => r.status === key).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-blue" /> Moderation
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats.totalReports} reports · {stats.moderatedItems.toLocaleString()} items
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Pending Reports" value={stats.pending} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard icon={Check} label="Resolved Reports" value={stats.resolved} color="bg-green-500/10 text-green-400" />
        <StatCard icon={Flag} label="Total Reports" value={stats.totalReports} color="bg-red-500/10 text-red-400" />
        <StatCard icon={Shield} label="Moderated Items" value={stats.moderatedItems.toLocaleString()} color="bg-brand-blue/10 text-brand-blue" />
      </div>

      {/* ---------------- Reports Queue ---------------- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-brand-blue" />
          <h2 className="font-display font-semibold text-lg text-white">Content Reports</h2>
        </div>

        {/* Search + status filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-brand-800 border border-white/8 rounded-xl p-1 overflow-x-auto">
            {STATUS_FILTERS.map((tab) => {
              const active = statusFilter === tab.key;
              const count = countFor(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
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

        {/* Reports table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Content ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Reporter</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Reported</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500">
                        <Flag className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((r) => {
                      const cfg = contentTypeConfig[r.content_type] || {
                        label: r.content_type,
                        icon: AlertTriangle,
                        color: 'text-gray-400 bg-gray-400/15',
                      };
                      return (
                        <tr key={r.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${cfg.color}`}>
                              <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-400 font-mono truncate max-w-[120px] block">{r.content_id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-300 line-clamp-1 max-w-[220px]">{r.reason}</p>
                            {r.resolution_note && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1 max-w-[220px]">
                                Note: {r.resolution_note}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm text-gray-400">{r.reporter?.username || 'Anonymous'}</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">{statusBadge(r.status)}</td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm text-gray-500">
                              {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'pending' && (
                                <button
                                  onClick={() => markReviewing(r.id)}
                                  disabled={busyId === r.id}
                                  title="Mark as reviewing"
                                  className="p-1.5 text-gray-500 hover:text-blue-400 rounded-lg hover:bg-blue-400/10 transition-colors disabled:opacity-50"
                                >
                                  {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              {r.status !== 'resolved' && (
                                <button
                                  onClick={() => resolveReport(r.id)}
                                  disabled={busyId === r.id}
                                  title="Resolve"
                                  className="p-1.5 text-gray-500 hover:text-green-400 rounded-lg hover:bg-green-400/10 transition-colors disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {r.status !== 'dismissed' && (
                                <button
                                  onClick={() => dismissReport(r.id)}
                                  disabled={busyId === r.id}
                                  title="Dismiss"
                                  className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteReport(r.id)}
                                disabled={busyId === r.id}
                                title="Delete report"
                                className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---------------- Content Quick-Remove ---------------- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-brand-blue" />
          <h2 className="font-display font-semibold text-lg text-white">Content Quick-Remove</h2>
        </div>

        {/* Content tabs */}
        <div className="flex items-center gap-1.5 bg-brand-800 border border-white/8 rounded-xl p-1 overflow-x-auto w-fit">
          {CONTENT_TABS.map((tab) => {
            const active = contentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setContentTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Projects tab */}
        {contentTab === 'projects' && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Creator</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Upvotes</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {tabLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        <FolderGit2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        No projects found.
                      </td>
                    </tr>
                  ) : (
                    projects.map((p) => (
                      <tr key={p.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <FolderGit2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm text-white font-medium line-clamp-1">{p.title}</p>
                              <p className="text-xs text-gray-600 font-mono mt-0.5">/projects#{p.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-300">{p.profiles?.username || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-400">{p.upvote_count || 0}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">{projectStatusBadge(p.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
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
                              {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Project comments tab */}
        {contentTab === 'comments' && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Project</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Posted</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {tabLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
                      </td>
                    </tr>
                  ) : comments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        No project comments found.
                      </td>
                    </tr>
                  ) : (
                    comments.map((c) => (
                      <tr key={c.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-300 line-clamp-2 max-w-[280px]">{c.content}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-brand-blue line-clamp-1 max-w-[180px]">
                            {c.projects?.title || 'Unknown project'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-300">{c.profiles?.username || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-500">
                            {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => deleteComment(c)}
                              disabled={busyId === c.id}
                              title="Delete comment"
                              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                              {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Challenge submissions tab */}
        {contentTab === 'submissions' && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submission</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Challenge</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Submitted</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {tabLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-blue mx-auto" />
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        <Rocket className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        No challenge submissions found.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <Rocket className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-white font-medium line-clamp-1 max-w-[260px]">{s.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-brand-blue line-clamp-1 max-w-[180px]">
                            {s.challenges?.title || 'Unknown challenge'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-300">{s.profiles?.username || 'Unknown'}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-500">
                            {s.created_at ? formatDistanceToNow(new Date(s.created_at), { addSuffix: true }) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => deleteSubmission(s)}
                              disabled={busyId === s.id}
                              title="Delete submission"
                              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                              {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* helpers to compute stat deltas without stale closures */
function r_statusWasPending(reports: ContentReport[], id: string) {
  return reports.find((r) => r.id === id)?.status === 'pending';
}
function r_statusWasResolved(reports: ContentReport[], id: string) {
  return reports.find((r) => r.id === id)?.status === 'resolved';
}
