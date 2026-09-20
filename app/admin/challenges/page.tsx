'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import {
  Rocket, Plus, Search, Trash2, Edit, Trophy, Eye, Loader2, X, Check,
  Calendar, Users, Flame, Star, ChevronDown, AlertTriangle, Crown,
} from 'lucide-react';

type ChallengeCategory = 'Build' | 'Design' | 'Launch' | 'Automate';
type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
type ChallengeStatus = 'upcoming' | 'active' | 'voting' | 'closed';

interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  prompt: string | null;
  category: string | null;
  difficulty: ChallengeDifficulty;
  xp_reward: number;
  starts_at: string | null;
  ends_at: string | null;
  status: ChallengeStatus;
  submission_count: number;
  is_featured: boolean;
  created_at: string;
}

interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  title: string;
  description: string | null;
  link_url: string | null;
  image_url: string | null;
  vote_count: number;
  is_winner: boolean;
  rank: number | null;
  created_at: string;
  profiles?: { username: string } | null;
}

const CATEGORIES: ChallengeCategory[] = ['Build', 'Design', 'Launch', 'Automate'];

const DIFFICULTY_BADGES: Record<ChallengeDifficulty, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
};

const STATUS_BADGES: Record<ChallengeStatus, string> = {
  upcoming: 'bg-blue-500/15 text-blue-400',
  active: 'bg-green-500/15 text-green-400',
  voting: 'bg-purple-500/15 text-purple-400',
  closed: 'bg-gray-500/15 text-gray-400',
};

const STATUS_CYCLE: ChallengeStatus[] = ['upcoming', 'active', 'voting', 'closed'];

const nextStatus = (s: ChallengeStatus): ChallengeStatus =>
  STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const toDateTimeLocal = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (dt: string): string | null =>
  dt ? new Date(dt).toISOString() : null;

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

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Stats
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    prompt: '',
    category: 'Build' as ChallengeCategory,
    difficulty: 'easy' as ChallengeDifficulty,
    xp_reward: 100,
    starts_at: '',
    ends_at: '',
    status: 'upcoming' as ChallengeStatus,
    is_featured: false,
  });
  const [creating, setCreating] = useState(false);

  // Row actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Submissions
  const [expandId, setExpandId] = useState<string | null>(null);
  const [submissionsCache, setSubmissionsCache] = useState<Record<string, Submission[]>>({});
  const [subLoading, setSubLoading] = useState<Record<string, boolean>>({});
  const [subActionLoading, setSubActionLoading] = useState<Record<string, boolean>>({});

  const fetchChallenges = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setChallenges([]);
      setLoading(false);
      return;
    }
    setChallenges((data || []) as Challenge[]);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [subsRes, votesRes] = await Promise.all([
      supabase.from('challenge_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('challenge_votes').select('*', { count: 'exact', head: true }),
    ]);
    setTotalSubmissions(subsRes.count || 0);
    setTotalVotes(votesRes.count || 0);
  }, []);

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, [fetchChallenges, fetchStats]);

  const fetchSubmissions = useCallback(async (challengeId: string) => {
    setSubLoading((p) => ({ ...p, [challengeId]: true }));
    const { data, error: err } = await supabase
      .from('challenge_submissions')
      .select('*, profiles:user_id(username)')
      .eq('challenge_id', challengeId)
      .order('vote_count', { ascending: false });
    setSubLoading((p) => ({ ...p, [challengeId]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    setSubmissionsCache((p) => ({ ...p, [challengeId]: (data || []) as Submission[] }));
  }, []);

  const toggleExpand = (challengeId: string) => {
    if (expandId === challengeId) {
      setExpandId(null);
      return;
    }
    setExpandId(challengeId);
    if (!submissionsCache[challengeId]) {
      fetchSubmissions(challengeId);
    }
  };

  const createChallenge = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setCreating(true);
    setError('');

    const payload: Record<string, any> = {
      title: form.title.trim(),
      slug: slugify(form.title),
      description: form.description.trim() || null,
      prompt: form.prompt.trim() || null,
      category: form.category,
      difficulty: form.difficulty,
      xp_reward: Number(form.xp_reward) || 0,
      starts_at: toISO(form.starts_at),
      ends_at: toISO(form.ends_at),
      status: form.status,
      is_featured: form.is_featured,
      submission_count: 0,
    };

    const { error: err } = await supabase.from('challenges').insert(payload);

    setCreating(false);
    if (err) {
      setError(err.message);
      return;
    }

    setForm({
      title: '',
      description: '',
      prompt: '',
      category: 'Build',
      difficulty: 'easy',
      xp_reward: 100,
      starts_at: '',
      ends_at: '',
      status: 'upcoming',
      is_featured: false,
    });
    setShowForm(false);
    fetchChallenges();
  };

  const startEdit = (c: Challenge) => {
    setEditId(editId === c.id ? null : c.id);
    setEditForm({
      title: c.title,
      description: c.description || '',
      prompt: c.prompt || '',
      category: c.category || 'Build',
      difficulty: c.difficulty,
      xp_reward: c.xp_reward,
      starts_at: toDateTimeLocal(c.starts_at),
      ends_at: toDateTimeLocal(c.ends_at),
      status: c.status,
    });
  };

  const saveEdit = async (id: string) => {
    if (!editForm.title?.trim()) {
      setError('Title is required');
      return;
    }
    setSavingEdit(true);
    setError('');
    const { error: err } = await supabase
      .from('challenges')
      .update({
        title: editForm.title.trim(),
        slug: slugify(editForm.title),
        description: (editForm.description as string).trim() || null,
        prompt: (editForm.prompt as string).trim() || null,
        category: editForm.category,
        difficulty: editForm.difficulty,
        xp_reward: Number(editForm.xp_reward) || 0,
        starts_at: toISO(editForm.starts_at as string),
        ends_at: toISO(editForm.ends_at as string),
        status: editForm.status as ChallengeStatus,
      })
      .eq('id', id);
    setSavingEdit(false);
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              title: editForm.title.trim(),
              slug: slugify(editForm.title),
              description: (editForm.description as string).trim() || null,
              prompt: (editForm.prompt as string).trim() || null,
              category: editForm.category,
              difficulty: editForm.difficulty as ChallengeDifficulty,
              xp_reward: Number(editForm.xp_reward) || 0,
              starts_at: toISO(editForm.starts_at as string),
              ends_at: toISO(editForm.ends_at as string),
              status: editForm.status as ChallengeStatus,
            }
          : c
      )
    );
    setEditId(null);
  };

  const cycleStatus = async (c: Challenge) => {
    const next = nextStatus(c.status);
    setActionLoading((p) => ({ ...p, [c.id]: true }));
    const { error: err } = await supabase
      .from('challenges')
      .update({ status: next })
      .eq('id', c.id);
    setActionLoading((p) => ({ ...p, [c.id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) =>
      prev.map((ch) => (ch.id === c.id ? { ...ch, status: next } : ch))
    );
  };

  const toggleFeatured = async (c: Challenge) => {
    const next = !c.is_featured;
    setActionLoading((p) => ({ ...p, [c.id]: true }));
    const { error: err } = await supabase
      .from('challenges')
      .update({ is_featured: next })
      .eq('id', c.id);
    setActionLoading((p) => ({ ...p, [c.id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) =>
      prev.map((ch) => (ch.id === c.id ? { ...ch, is_featured: next } : ch))
    );
  };

  const deleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge? All associated submissions and votes will also be removed. This cannot be undone.')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    // Cascade: votes → submissions → challenge
    const { data: subs } = await supabase
      .from('challenge_submissions')
      .select('id')
      .eq('challenge_id', id);
    if (subs && subs.length) {
      const subIds = subs.map((s) => s.id);
      await supabase.from('challenge_votes').delete().in('submission_id', subIds);
    }
    await supabase.from('challenge_submissions').delete().eq('challenge_id', id);
    const { error: err } = await supabase.from('challenges').delete().eq('id', id);
    setActionLoading((p) => ({ ...p, [id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    setSubmissionsCache((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (expandId === id) setExpandId(null);
    fetchStats();
  };

  const markWinner = async (sub: Submission, challengeId: string) => {
    setSubActionLoading((p) => ({ ...p, [sub.id]: true }));
    // Clear any existing winner in this challenge
    await supabase
      .from('challenge_submissions')
      .update({ is_winner: false, rank: null })
      .eq('challenge_id', challengeId)
      .neq('id', sub.id);
    const { error: err } = await supabase
      .from('challenge_submissions')
      .update({ is_winner: true, rank: 1 })
      .eq('id', sub.id);
    setSubActionLoading((p) => ({ ...p, [sub.id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    fetchSubmissions(challengeId);
  };

  const removeWinner = async (sub: Submission, challengeId: string) => {
    if (!confirm('Remove winner status from this submission?')) return;
    setSubActionLoading((p) => ({ ...p, [sub.id]: true }));
    const { error: err } = await supabase
      .from('challenge_submissions')
      .update({ is_winner: false, rank: null })
      .eq('id', sub.id);
    setSubActionLoading((p) => ({ ...p, [sub.id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    fetchSubmissions(challengeId);
  };

  const deleteSubmission = async (sub: Submission, challengeId: string) => {
    if (!confirm('Delete this submission? All associated votes will also be removed. This cannot be undone.')) return;
    setSubActionLoading((p) => ({ ...p, [sub.id]: true }));
    await supabase.from('challenge_votes').delete().eq('submission_id', sub.id);
    const { error: err } = await supabase.from('challenge_submissions').delete().eq('id', sub.id);
    setSubActionLoading((p) => ({ ...p, [sub.id]: false }));
    if (err) {
      setError(err.message);
      return;
    }
    fetchSubmissions(challengeId);
    fetchChallenges();
    fetchStats();
  };

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';
  const labelClass = 'text-xs text-gray-500 mb-1.5 block';

  const filtered = challenges.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = challenges.filter((c) => c.status === 'active').length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-brand-blue" /> Challenges
          </h1>
          <p className="text-gray-500 text-sm">{challenges.length} total challenges</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Challenge'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto p-0.5 hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Participation Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Rocket} label="Total Challenges" value={challenges.length} color="bg-brand-blue/15 text-brand-blue" />
        <StatCard icon={Flame} label="Active Challenges" value={activeCount} color="bg-green-500/10 text-green-400" />
        <StatCard icon={Users} label="Total Submissions" value={totalSubmissions.toLocaleString()} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={Trophy} label="Total Votes Cast" value={totalVotes.toLocaleString()} color="bg-yellow-500/10 text-yellow-400" />
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 border border-white/8">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-blue" /> Create New Challenge
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Build a RAG-powered support bot in 48 hours"
                className={inputClass}
              />
              {form.title && (
                <p className="text-xs text-gray-600 mt-1.5 font-mono">slug: {slugify(form.title)}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description shown on the challenge card..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Prompt</label>
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                placeholder="The full prompt / instructions participants follow..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ChallengeCategory }))}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as ChallengeDifficulty }))}
                className={inputClass}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>XP Reward *</label>
              <input
                type="number"
                min={0}
                value={form.xp_reward}
                onChange={(e) => setForm((f) => ({ ...f, xp_reward: Number(e.target.value) }))}
                placeholder="100"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ChallengeStatus }))}
                className={inputClass}
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="voting">Voting</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Starts At</label>
              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Ends At</label>
              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-brand-800 text-brand-blue focus:ring-brand-blue/50 cursor-pointer"
                />
                <span className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-400" /> Mark as featured
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={createChallenge}
              disabled={creating || !form.title.trim()}
              className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Challenge'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges by title..."
          className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 max-w-sm"
        />
      </div>

      {/* Challenges Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Difficulty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">XP</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Subs</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Schedule</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading challenges...
                  </span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-500">
                  {search ? 'No challenges match your search.' : 'No challenges yet. Create one to get started.'}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const subs = submissionsCache[c.id] || [];
                const isExpanded = expandId === c.id;
                return (
                  <>
                    <tr key={c.id} className="hover:bg-white/2 transition-colors">
                      {/* Expand */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(c.id)}
                          title="View submissions"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isExpanded
                              ? 'text-brand-blue bg-brand-blue/10'
                              : 'text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10'
                          }`}
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <Rocket className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm text-white line-clamp-1 font-medium">{c.title}</p>
                              {c.is_featured && (
                                <Star className="w-3.5 h-3.5 text-yellow-400 shrink-0 fill-yellow-400" />
                              )}
                            </div>
                            {c.prompt && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{c.prompt}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300">{c.category}</span>
                        ) : (
                          <span className="text-xs text-gray-700">—</span>
                        )}
                      </td>

                      {/* Difficulty */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_BADGES[c.difficulty]}`}>
                          {c.difficulty}
                        </span>
                      </td>

                      {/* Status (clickable to cycle) */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => cycleStatus(c)}
                          disabled={actionLoading[c.id]}
                          title={`Click to advance: ${STATUS_CYCLE.join(' → ')}`}
                          className={`text-xs px-2 py-0.5 rounded-full capitalize transition-all hover:brightness-125 disabled:opacity-50 ${STATUS_BADGES[c.status]}`}
                        >
                          {actionLoading[c.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : (
                            c.status
                          )}
                        </button>
                      </td>

                      {/* XP */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-yellow-400/70" /> {c.xp_reward || 0}
                        </span>
                      </td>

                      {/* Subs */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> {c.submission_count || 0}
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                        <div className="flex flex-col gap-0.5">
                          {c.starts_at ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-700">No start</span>
                          )}
                          {c.ends_at && (
                            <span className="text-gray-600 pl-4">
              → {new Date(c.ends_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle featured */}
                          <button
                            onClick={() => toggleFeatured(c)}
                            disabled={actionLoading[c.id]}
                            title={c.is_featured ? 'Remove featured' : 'Mark as featured'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              c.is_featured
                                ? 'text-yellow-400 hover:bg-yellow-400/10'
                                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                            }`}
                          >
                            {actionLoading[c.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className={`w-3.5 h-3.5 ${c.is_featured ? 'fill-yellow-400' : ''}`} />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => startEdit(c)}
                            title="Edit challenge"
                            className={`p-1.5 rounded-lg transition-colors ${
                              editId === c.id
                                ? 'text-brand-blue bg-brand-blue/10'
                                : 'text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10'
                            }`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deleteChallenge(c.id)}
                            disabled={actionLoading[c.id]}
                            title="Delete challenge"
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Edit inline form */}
                    {editId === c.id && (
                      <tr key={`${c.id}-edit`} className="bg-brand-800/40">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Edit className="w-4 h-4 text-brand-blue" />
                            <span className="text-sm text-white font-medium">Edit Challenge</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className={labelClass}>Title *</label>
                              <input
                                type="text"
                                value={editForm.title || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                                className={inputClass}
                              />
                              {editForm.title && (
                                <p className="text-xs text-gray-600 mt-1.5 font-mono">slug: {slugify(editForm.title)}</p>
                              )}
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className={labelClass}>Description</label>
                              <textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                                className={`${inputClass} resize-none`}
                              />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className={labelClass}>Prompt</label>
                              <textarea
                                value={editForm.prompt || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, prompt: e.target.value }))}
                                rows={3}
                                className={`${inputClass} resize-none`}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Category</label>
                              <select
                                value={editForm.category || 'Build'}
                                onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                                className={inputClass}
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Difficulty</label>
                              <select
                                value={editForm.difficulty || 'easy'}
                                onChange={(e) => setEditForm((f) => ({ ...f, difficulty: e.target.value }))}
                                className={inputClass}
                              >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>Status</label>
                              <select
                                value={editForm.status || 'upcoming'}
                                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                                className={inputClass}
                              >
                                <option value="upcoming">Upcoming</option>
                                <option value="active">Active</option>
                                <option value="voting">Voting</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                            <div>
                              <label className={labelClass}>XP Reward</label>
                              <input
                                type="number"
                                min={0}
                                value={editForm.xp_reward ?? 0}
                                onChange={(e) => setEditForm((f) => ({ ...f, xp_reward: Number(e.target.value) }))}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Starts At</label>
                              <input
                                type="datetime-local"
                                value={editForm.starts_at || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, starts_at: e.target.value }))}
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Ends At</label>
                              <input
                                type="datetime-local"
                                value={editForm.ends_at || ''}
                                onChange={(e) => setEditForm((f) => ({ ...f, ends_at: e.target.value }))}
                                className={inputClass}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-5">
                            <button
                              onClick={() => saveEdit(c.id)}
                              disabled={savingEdit || !editForm.title?.trim()}
                              className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
                            >
                              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              {savingEdit ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={() => setEditId(null)}
                              className="px-4 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Submissions section */}
                    {isExpanded && (
                      <tr key={`${c.id}-subs`} className="bg-brand-800/40">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-brand-blue" />
                            <span className="text-sm text-white font-medium">Submissions</span>
                            <span className="text-xs text-gray-500">— {subs.length} total</span>
                          </div>
                          {subLoading[c.id] ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading submissions...
                            </div>
                          ) : subs.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">No submissions have been made for this challenge yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {subs.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center gap-3 p-3 bg-brand-900/60 border border-white/6 rounded-xl hover:border-white/12 transition-colors"
                                >
                                  {/* Winner crown */}
                                  <div className="shrink-0">
                                    {sub.is_winner ? (
                                      <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center">
                                        <Crown className="w-4 h-4 text-yellow-400" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                                        <Trophy className="w-4 h-4 text-gray-600" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Title + meta */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-white font-medium line-clamp-1">{sub.title}</p>
                                      {sub.is_winner && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold shrink-0">
                                          WINNER
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {sub.profiles?.username || 'Unknown'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Trophy className="w-3 h-3" /> {sub.vote_count || 0} votes
                                      </span>
                                      <span className="hidden sm:flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                                      </span>
                                      {sub.link_url && (
                                        <a
                                          href={sub.link_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hidden md:flex items-center gap-1 text-brand-blue hover:text-blue-300"
                                        >
                                          <Eye className="w-3 h-3" /> View
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {!sub.is_winner ? (
                                      <button
                                        onClick={() => markWinner(sub, c.id)}
                                        disabled={subActionLoading[sub.id]}
                                        title="Mark as winner"
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {subActionLoading[sub.id] ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Crown className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Mark Winner</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => removeWinner(sub, c.id)}
                                        disabled={subActionLoading[sub.id]}
                                        title="Remove winner status"
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        {subActionLoading[sub.id] ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <X className="w-3.5 h-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Remove</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteSubmission(sub, c.id)}
                                      disabled={subActionLoading[sub.id]}
                                      title="Delete submission"
                                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
