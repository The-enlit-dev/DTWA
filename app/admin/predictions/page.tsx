'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Trophy, Plus, Search, Trash2, Eye, X, Check, Loader2,
  TrendingUp, Vote, Calendar, AlertTriangle, Flame, ChevronDown,
} from 'lucide-react';

type PredictionType = 'year' | 'value' | 'choice' | 'yesno';
type PredictionStatus = 'open' | 'closed' | 'resolved';

interface Prediction {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  type: PredictionType;
  options: string[] | null;
  target_date: string | null;
  status: PredictionStatus;
  resolution: string | null;
  created_by: string | null;
  vote_count: number;
  is_trending: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<PredictionType, string> = {
  year: 'Year',
  value: 'Value',
  choice: 'Choice',
  yesno: 'Yes / No',
};

const TYPE_BADGES: Record<PredictionType, string> = {
  year: 'bg-blue-500/15 text-blue-400',
  value: 'bg-cyan-500/15 text-cyan-400',
  choice: 'bg-purple-500/15 text-purple-400',
  yesno: 'bg-pink-500/15 text-pink-400',
};

const STATUS_BADGES: Record<PredictionStatus, string> = {
  open: 'bg-green-500/15 text-green-400',
  closed: 'bg-gray-500/15 text-gray-400',
  resolved: 'bg-yellow-500/15 text-yellow-400',
};

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

export default function AdminPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Stats
  const [totalVotes, setTotalVotes] = useState(0);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    type: 'year' as PredictionType,
    options: '',
    target_date: '',
    is_trending: false,
  });
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Row actions
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [viewVotesId, setViewVotesId] = useState<string | null>(null);
  const [voteDist, setVoteDist] = useState<Record<string, Record<string, number>>>({});
  const [voteLoading, setVoteLoading] = useState<string | null>(null);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const fetchPredictions = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setPredictions([]);
      setLoading(false);
      return;
    }
    setPredictions((data || []) as Prediction[]);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const { count } = await supabase
      .from('prediction_votes')
      .select('*', { count: 'exact', head: true });
    setTotalVotes(count || 0);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('name').order('name');
    setCategories((data || []).map((c: any) => c.name));
  }, []);

  useEffect(() => {
    fetchPredictions();
    fetchStats();
    fetchCategories();
  }, [fetchPredictions, fetchStats, fetchCategories]);

  const createPrediction = async () => {
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
      category: form.category.trim() || null,
      type: form.type,
      target_date: form.target_date || null,
      is_trending: form.is_trending,
      status: 'open',
      vote_count: 0,
    };

    if (form.type === 'choice') {
      const opts = form.options
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      payload.options = opts.length ? opts : null;
    } else {
      payload.options = null;
    }

    const { error: err } = await supabase.from('predictions').insert(payload);

    setCreating(false);
    if (err) {
      setError(err.message);
      return;
    }

    // Reset form
    setForm({
      title: '',
      description: '',
      category: '',
      type: 'year',
      options: '',
      target_date: '',
      is_trending: false,
    });
    setShowForm(false);
    fetchPredictions();
    fetchStats();
  };

  const closePrediction = async (id: string) => {
    if (!confirm('Close this prediction? Users will no longer be able to vote.')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    const { error: err } = await supabase
      .from('predictions')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', id);
    setActionLoading((p) => ({ ...p, [id]: false }));
    if (err) { setError(err.message); return; }
    setPredictions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'closed' as PredictionStatus } : p))
    );
  };

  const resolvePrediction = async (id: string) => {
    if (!resolutionText.trim()) {
      setError('Resolution text is required to resolve a prediction.');
      return;
    }
    setActionLoading((p) => ({ ...p, [id]: true }));
    const { error: err } = await supabase
      .from('predictions')
      .update({
        status: 'resolved',
        resolution: resolutionText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    setActionLoading((p) => ({ ...p, [id]: false }));
    if (err) { setError(err.message); return; }
    setPredictions((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'resolved' as PredictionStatus, resolution: resolutionText.trim() }
          : p
      )
    );
    setResolveId(null);
    setResolutionText('');
  };

  const toggleTrending = async (pred: Prediction) => {
    const next = !pred.is_trending;
    setActionLoading((p) => ({ ...p, [pred.id]: true }));
    const { error: err } = await supabase
      .from('predictions')
      .update({ is_trending: next, updated_at: new Date().toISOString() })
      .eq('id', pred.id);
    setActionLoading((p) => ({ ...p, [pred.id]: false }));
    if (err) { setError(err.message); return; }
    setPredictions((prev) =>
      prev.map((p) => (p.id === pred.id ? { ...p, is_trending: next } : p))
    );
  };

  const deletePrediction = async (id: string) => {
    if (!confirm('Delete this prediction? All associated votes will also be removed. This cannot be undone.')) return;
    setActionLoading((p) => ({ ...p, [id]: true }));
    await supabase.from('prediction_votes').delete().eq('prediction_id', id);
    const { error: err } = await supabase.from('predictions').delete().eq('id', id);
    setActionLoading((p) => ({ ...p, [id]: false }));
    if (err) { setError(err.message); return; }
    setPredictions((prev) => prev.filter((p) => p.id !== id));
    fetchStats();
  };

  const fetchVoteDistribution = async (id: string) => {
    setVoteLoading(id);
    const { data } = await supabase
      .from('prediction_votes')
      .select('vote_value')
      .eq('prediction_id', id);
    setVoteLoading(null);
    const dist: Record<string, number> = {};
    (data || []).forEach((v: any) => {
      const key = String(v.vote_value);
      dist[key] = (dist[key] || 0) + 1;
    });
    setVoteDist((prev) => ({ ...prev, [id]: dist }));
  };

  const toggleViewVotes = (id: string) => {
    if (viewVotesId === id) {
      setViewVotesId(null);
      return;
    }
    setViewVotesId(id);
    if (!voteDist[id]) {
      fetchVoteDistribution(id);
    }
  };

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  const labelClass = 'text-xs text-gray-500 mb-1.5 block';

  const filtered = predictions.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = predictions.filter((p) => p.status === 'open').length;
  const resolvedCount = predictions.filter((p) => p.status === 'resolved').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand-blue" /> Predictions
          </h1>
          <p className="text-gray-500 text-sm">{predictions.length} total predictions</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Prediction'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Participation Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Trophy} label="Total Predictions" value={predictions.length} color="bg-brand-blue/15 text-brand-blue" />
        <StatCard icon={Vote} label="Total Votes Cast" value={totalVotes.toLocaleString()} color="bg-green-500/10 text-green-400" />
        <StatCard icon={TrendingUp} label="Open Predictions" value={openCount} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={Check} label="Resolved Predictions" value={resolvedCount} color="bg-yellow-500/10 text-yellow-400" />
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 border border-white/8">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-blue" /> Create New Prediction
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. AGI achieved by 2030"
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
                placeholder="Describe the prediction in detail..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PredictionType }))}
                className={inputClass}
              >
                <option value="year">Year</option>
                <option value="value">Value</option>
                <option value="choice">Choice</option>
                <option value="yesno">Yes / No</option>
              </select>
            </div>

            {form.type === 'choice' && (
              <div className="md:col-span-2">
                <label className={labelClass}>Options (comma-separated)</label>
                <input
                  type="text"
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="e.g. OpenAI, Google, Anthropic, Other"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Target Date</label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_trending}
                  onChange={(e) => setForm((f) => ({ ...f, is_trending: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/20 bg-brand-800 text-brand-blue focus:ring-brand-blue/50 cursor-pointer"
                />
                <span className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Mark as trending
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={createPrediction}
              disabled={creating || !form.title.trim()}
              className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Prediction'}
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
          placeholder="Search predictions by title..."
          className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 max-w-sm"
        />
      </div>

      {/* Predictions Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Votes</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Trending</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Created</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading predictions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  {search ? 'No predictions match your search.' : 'No predictions yet. Create one to get started.'}
                </td>
              </tr>
            ) : (
              filtered.map((pred) => {
                const dist = voteDist[pred.id];
                const distEntries = dist ? Object.entries(dist).sort((a, b) => b[1] - a[1]) : [];
                const maxDist = distEntries.length ? distEntries[0][1] : 1;

                return (
                  <>
                    <tr key={pred.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <Trophy className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white line-clamp-1 font-medium">{pred.title}</p>
                            {pred.resolution && (
                              <p className="text-xs text-yellow-400/80 mt-0.5 line-clamp-1">
                                <Check className="w-3 h-3 inline mr-1" />{pred.resolution}
                              </p>
                            )}
                            {pred.target_date && (
                              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(pred.target_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {pred.category ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300">{pred.category}</span>
                        ) : (
                          <span className="text-xs text-gray-700">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_BADGES[pred.type]}`}>
                          {TYPE_LABELS[pred.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_BADGES[pred.status]}`}>
                          {pred.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Vote className="w-3 h-3" /> {pred.vote_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {pred.is_trending ? (
                          <span className="text-xs text-orange-400 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-700">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                        {new Date(pred.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View votes */}
                          <button
                            onClick={() => toggleViewVotes(pred.id)}
                            title="View vote distribution"
                            className={`p-1.5 rounded-lg transition-colors ${
                              viewVotesId === pred.id
                                ? 'text-brand-blue bg-brand-blue/10'
                                : 'text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Close */}
                          {pred.status === 'open' && (
                            <button
                              onClick={() => closePrediction(pred.id)}
                              disabled={actionLoading[pred.id]}
                              title="Close prediction"
                              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                              {actionLoading[pred.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Resolve */}
                          {pred.status !== 'resolved' && (
                            <button
                              onClick={() => {
                                setResolveId(resolveId === pred.id ? null : pred.id);
                                setResolutionText(pred.resolution || '');
                              }}
                              title="Resolve prediction"
                              className="p-1.5 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-yellow-400/10 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle trending */}
                          <button
                            onClick={() => toggleTrending(pred)}
                            disabled={actionLoading[pred.id]}
                            title={pred.is_trending ? 'Remove trending' : 'Mark as trending'}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              pred.is_trending
                                ? 'text-orange-400 hover:bg-orange-400/10'
                                : 'text-gray-500 hover:text-orange-400 hover:bg-orange-400/10'
                            }`}
                          >
                            {actionLoading[pred.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deletePrediction(pred.id)}
                            disabled={actionLoading[pred.id]}
                            title="Delete prediction"
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Resolve inline form */}
                    {resolveId === pred.id && (
                      <tr key={`${pred.id}-resolve`} className="bg-brand-800/40">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2 shrink-0">
                              <Check className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-white font-medium">Resolution</span>
                            </div>
                            <input
                              type="text"
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              placeholder="e.g. Resolved: AGI was declared achieved in 2028..."
                              className="flex-1 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && resolvePrediction(pred.id)}
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => resolvePrediction(pred.id)}
                                disabled={actionLoading[pred.id] || !resolutionText.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {actionLoading[pred.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Resolve
                              </button>
                              <button
                                onClick={() => { setResolveId(null); setResolutionText(''); }}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Vote distribution */}
                    {viewVotesId === pred.id && (
                      <tr key={`${pred.id}-votes`} className="bg-brand-800/40">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Vote className="w-4 h-4 text-brand-blue" />
                            <span className="text-sm text-white font-medium">Vote Distribution</span>
                            <span className="text-xs text-gray-500">— {pred.vote_count || 0} total votes</span>
                          </div>
                          {voteLoading === pred.id ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading votes...
                            </div>
                          ) : distEntries.length === 0 ? (
                            <p className="text-sm text-gray-500 py-2">No votes have been cast on this prediction yet.</p>
                          ) : (
                            <div className="space-y-2.5 max-w-lg">
                              {distEntries.map(([value, count]) => {
                                const pct = maxDist > 0 ? Math.round((count / maxDist) * 100) : 0;
                                const pctOfTotal = pred.vote_count > 0 ? Math.round((count / pred.vote_count) * 100) : 0;
                                return (
                                  <div key={value}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-gray-300 truncate">{value}</span>
                                      <span className="text-xs text-gray-400 font-medium shrink-0 ml-3">
                                        {count} ({pctOfTotal}%)
                                      </span>
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
