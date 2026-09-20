'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Lightbulb, Plus, Search, Trash2, Edit, Star, Bookmark, Loader2,
  X, Check, TrendingUp, Upload, AlertTriangle, ChevronDown,
} from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Idea {
  id: string;
  title: string;
  slug: string;
  pitch: string | null;
  description: string | null;
  category: string | null;
  difficulty: Difficulty | null;
  market_size: string | null;
  monetization: string | null;
  tech_stack: string[] | null;
  tags: string[] | null;
  rating_sum: number;
  rating_count: number;
  bookmark_count: number;
  is_featured: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  ratings: number;
  bookmarks: number;
  featured: number;
}

const DIFFICULTY_BADGES: Record<Difficulty, string> = {
  easy: 'bg-green-500/15 text-green-400',
  medium: 'bg-yellow-500/15 text-yellow-400',
  hard: 'bg-red-500/15 text-red-400',
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

const EMPTY_FORM = {
  title: '',
  pitch: '',
  description: '',
  category: '',
  difficulty: 'medium' as Difficulty,
  market_size: '',
  monetization: '',
  tech_stack: '',
  tags: '',
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, ratings: 0, bookmarks: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [creating, setCreating] = useState(false);

  // Bulk import
  const [showImport, setShowImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);

  // Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';
  const labelClass = 'text-xs text-gray-500 mb-1.5 block';

  const fetchIdeas = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('business_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setIdeas([]);
      setLoading(false);
      return;
    }
    setIdeas((data || []) as Idea[]);
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [
      { count: total },
      { count: featured },
    ] = await Promise.all([
      supabase.from('business_ideas').select('*', { count: 'exact', head: true }),
      supabase.from('business_ideas').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    ]);
    // Ratings and bookmarks are aggregated on rows, sum them client-side.
    const { data } = await supabase.from('business_ideas').select('rating_count, bookmark_count');
    const ratings = (data || []).reduce((acc: number, r: any) => acc + (r.rating_count || 0), 0);
    const bookmarks = (data || []).reduce((acc: number, r: any) => acc + (r.bookmark_count || 0), 0);
    setStats({
      total: total || 0,
      ratings,
      bookmarks,
      featured: featured || 0,
    });
  }, []);

  useEffect(() => {
    Promise.all([fetchIdeas(), fetchStats()]);
  }, [fetchIdeas, fetchStats]);

  const buildPayload = (f: typeof EMPTY_FORM) => ({
    title: f.title.trim(),
    slug: slugify(f.title),
    pitch: f.pitch.trim() || null,
    description: f.description.trim() || null,
    category: f.category.trim() || null,
    difficulty: f.difficulty,
    market_size: f.market_size.trim() || null,
    monetization: f.monetization.trim() || null,
    tech_stack: f.tech_stack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    tags: f.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    rating_sum: 0,
    rating_count: 0,
    bookmark_count: 0,
    is_featured: false,
  });

  const createIdea = async () => {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setCreating(true);
    setError('');
    const { error: err } = await supabase.from('business_ideas').insert(buildPayload(form));
    setCreating(false);
    if (err) {
      setError(err.message);
      return;
    }
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    fetchIdeas();
    fetchStats();
  };

  const toggleFeatured = async (idea: Idea) => {
    setBusyId(idea.id);
    const next = !idea.is_featured;
    const { error: err } = await supabase
      .from('business_ideas')
      .update({ is_featured: next })
      .eq('id', idea.id);
    setBusyId(null);
    if (err) { setError(err.message); return; }
    setIdeas((prev) => prev.map((x) => (x.id === idea.id ? { ...x, is_featured: next } : x)));
    setStats((s) => ({ ...s, featured: s.featured + (next ? 1 : -1) }));
  };

  const startEdit = (idea: Idea) => {
    if (editId === idea.id) {
      setEditId(null);
      return;
    }
    setEditId(idea.id);
    setEditForm({
      title: idea.title,
      pitch: idea.pitch || '',
      description: idea.description || '',
      category: idea.category || '',
      difficulty: idea.difficulty || 'medium',
      market_size: idea.market_size || '',
      monetization: idea.monetization || '',
      tech_stack: (idea.tech_stack || []).join(', '),
      tags: (idea.tags || []).join(', '),
    });
    setError('');
  };

  const saveEdit = async (idea: Idea) => {
    if (!editForm.title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('business_ideas')
      .update(buildPayload(editForm))
      .eq('id', idea.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setIdeas((prev) =>
      prev.map((x) => (x.id === idea.id ? { ...x, ...buildPayload(editForm) } as Idea : x))
    );
    setEditId(null);
  };

  const deleteIdea = async (idea: Idea) => {
    if (!confirm(`Delete "${idea.title}"? This cannot be undone.`)) return;
    setBusyId(idea.id);
    const { error: err } = await supabase.from('business_ideas').delete().eq('id', idea.id);
    setBusyId(null);
    if (err) { setError(err.message); return; }
    setIdeas((prev) => prev.filter((x) => x.id !== idea.id));
    setStats((s) => ({
      ...s,
      total: s.total - 1,
      ratings: s.ratings - (idea.rating_count || 0),
      bookmarks: s.bookmarks - (idea.bookmark_count || 0),
      featured: idea.is_featured ? s.featured - 1 : s.featured,
    }));
  };

  const bulkImport = async () => {
    setImporting(true);
    setError('');
    setImportResult(null);
    let parsed: any[];
    try {
      parsed = JSON.parse(bulkText);
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of idea objects');
    } catch (e: any) {
      setImporting(false);
      setError(`Invalid JSON: ${e.message}`);
      return;
    }

    const errors: string[] = [];
    const valid: any[] = [];
    parsed.forEach((item, i) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item ${i + 1}: not an object`);
        return;
      }
      if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
        errors.push(`Item ${i + 1}: missing required "title"`);
        return;
      }
      valid.push({
        title: String(item.title).trim(),
        slug: slugify(String(item.title)),
        pitch: item.pitch ? String(item.pitch) : null,
        description: item.description ? String(item.description) : null,
        category: item.category ? String(item.category) : null,
        difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
        market_size: item.market_size ? String(item.market_size) : null,
        monetization: item.monetization ? String(item.monetization) : null,
        tech_stack: Array.isArray(item.tech_stack) ? item.tech_stack.filter(Boolean) : [],
        tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
        rating_sum: 0,
        rating_count: 0,
        bookmark_count: 0,
        is_featured: !!item.is_featured,
      });
    });

    if (valid.length === 0) {
      setImporting(false);
      setImportResult({ ok: 0, fail: errors.length, errors });
      return;
    }

    const { error: err } = await supabase.from('business_ideas').insert(valid);
    setImporting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setImportResult({ ok: valid.length, fail: errors.length, errors });
    setBulkText('');
    fetchIdeas();
    fetchStats();
  };

  const filtered = ideas.filter(
    (i) => !search || i.title.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = (idea: Idea) =>
    idea.rating_count > 0 ? (idea.rating_sum / idea.rating_count).toFixed(1) : '—';

  const renderFormFields = (f: typeof EMPTY_FORM, set: (f: typeof EMPTY_FORM) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          value={f.title}
          onChange={(e) => set({ ...f, title: e.target.value })}
          placeholder="e.g. AI-Powered Recipe Generator"
          className={inputClass}
        />
        {f.title && (
          <p className="text-xs text-gray-600 mt-1.5 font-mono">slug: {slugify(f.title)}</p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Pitch</label>
        <input
          type="text"
          value={f.pitch}
          onChange={(e) => set({ ...f, pitch: e.target.value })}
          placeholder="One-line elevator pitch..."
          className={inputClass}
        />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Description</label>
        <textarea
          value={f.description}
          onChange={(e) => set({ ...f, description: e.target.value })}
          placeholder="Describe the idea in detail..."
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <input
          type="text"
          value={f.category}
          onChange={(e) => set({ ...f, category: e.target.value })}
          placeholder="e.g. AI, SaaS, Fintech"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Difficulty</label>
        <select
          value={f.difficulty}
          onChange={(e) => set({ ...f, difficulty: e.target.value as Difficulty })}
          className={inputClass}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Market Size</label>
        <input
          type="text"
          value={f.market_size}
          onChange={(e) => set({ ...f, market_size: e.target.value })}
          placeholder="e.g. $10B TAM"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Monetization</label>
        <input
          type="text"
          value={f.monetization}
          onChange={(e) => set({ ...f, monetization: e.target.value })}
          placeholder="e.g. Subscription, Ads"
          className={inputClass}
        />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Tech Stack (comma-separated)</label>
        <input
          type="text"
          value={f.tech_stack}
          onChange={(e) => set({ ...f, tech_stack: e.target.value })}
          placeholder="e.g. Next.js, Supabase, OpenAI"
          className={inputClass}
        />
      </div>

      <div className="md:col-span-2">
        <label className={labelClass}>Tags (comma-separated)</label>
        <input
          type="text"
          value={f.tags}
          onChange={(e) => set({ ...f, tags: e.target.value })}
          placeholder="e.g. productivity, mobile, b2b"
          className={inputClass}
        />
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-brand-blue" /> Ideas Vault
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{stats.total} total ideas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
          >
            {showImport ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showImport ? 'Cancel' : 'Bulk Import'}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Idea'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Lightbulb} label="Total Ideas" value={stats.total} color="bg-brand-blue/15 text-brand-blue" />
        <StatCard icon={Star} label="Total Ratings" value={stats.ratings.toLocaleString()} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard icon={Bookmark} label="Total Bookmarks" value={stats.bookmarks.toLocaleString()} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={TrendingUp} label="Featured Ideas" value={stats.featured} color="bg-green-500/10 text-green-400" />
      </div>

      {/* Add Idea Form */}
      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 border border-white/8">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-blue" /> Add New Idea
          </h3>
          {renderFormFields(form, setForm)}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={createIdea}
              disabled={creating || !form.title.trim()}
              className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Adding...' : 'Add Idea'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); setError(''); }}
              className="px-4 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showImport && (
        <div className="glass rounded-xl p-5 mb-6 border border-white/8">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-brand-blue" /> Bulk Import
          </h3>
          <label className={labelClass}>Paste JSON array of ideas</label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'[\n  {\n    "title": "AI Recipe Generator",\n    "pitch": "...",\n    "category": "AI",\n    "difficulty": "easy",\n    "tech_stack": ["Next.js", "OpenAI"],\n    "tags": ["food", "ai"]\n  }\n]'}
            rows={10}
            className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={bulkImport}
              disabled={importing || !bulkText.trim()}
              className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import Ideas'}
            </button>
            <button
              onClick={() => { setShowImport(false); setBulkText(''); setImportResult(null); setError(''); }}
              className="px-4 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {importResult && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 text-green-400">
                  <Check className="w-4 h-4" /> {importResult.ok} inserted
                </span>
                {importResult.fail > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-red-400">
                    <AlertTriangle className="w-4 h-4" /> {importResult.fail} skipped
                  </span>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 space-y-1">
                  {importResult.errors.map((msg, i) => (
                    <p key={i} className="text-xs text-red-400/90 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ideas by title..."
          className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-9 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Ideas Table */}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Idea</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Difficulty</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Market</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Bookmarks</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500">
                      <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      {search ? 'No ideas match your search.' : 'No ideas yet. Add one to get started.'}
                    </td>
                  </tr>
                ) : (
                  filtered.flatMap((idea) => {
                    const rows = [
                      <tr key={idea.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2.5">
                            <Lightbulb className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm text-white font-medium line-clamp-1">{idea.title}</p>
                                {idea.is_featured && (
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                                )}
                              </div>
                              {idea.pitch && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{idea.pitch}</p>
                              )}
                              <p className="text-xs text-gray-600 font-mono mt-0.5">/{idea.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {idea.category ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300">{idea.category}</span>
                          ) : (
                            <span className="text-xs text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {idea.difficulty ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_BADGES[idea.difficulty]}`}>
                              {idea.difficulty}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {idea.market_size ? (
                            <span className="text-sm text-gray-400">{idea.market_size}</span>
                          ) : (
                            <span className="text-xs text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                            {avgRating(idea)}
                            {idea.rating_count > 0 && (
                              <span className="text-xs text-gray-600">({idea.rating_count})</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-400 flex items-center gap-1">
                            <Bookmark className="w-3.5 h-3.5 text-gray-500" />
                            {idea.bookmark_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleFeatured(idea)}
                              disabled={busyId === idea.id}
                              title={idea.is_featured ? 'Unfeature' : 'Feature'}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                idea.is_featured
                                  ? 'text-yellow-400 hover:bg-yellow-400/10'
                                  : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
                              }`}
                            >
                              {busyId === idea.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Star className={`w-3.5 h-3.5 ${idea.is_featured ? 'fill-yellow-400' : ''}`} />
                              )}
                            </button>
                            <button
                              onClick={() => startEdit(idea)}
                              title="Edit"
                              className={`p-1.5 rounded-lg transition-colors ${
                                editId === idea.id
                                  ? 'text-brand-blue bg-brand-blue/10'
                                  : 'text-gray-500 hover:text-brand-blue hover:bg-brand-blue/10'
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteIdea(idea)}
                              disabled={busyId === idea.id}
                              title="Delete"
                              className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>,
                    ];

                    if (editId === idea.id) {
                      rows.push(
                        <tr key={`${idea.id}-edit`} className="bg-brand-800/40">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Edit className="w-4 h-4 text-brand-blue" />
                              <span className="text-sm text-white font-medium">Edit Idea</span>
                              <span className="text-xs text-gray-500 font-mono truncate">— {idea.slug}</span>
                            </div>
                            {renderFormFields(editForm, setEditForm)}
                            <div className="flex items-center gap-3 mt-5">
                              <button
                                onClick={() => saveEdit(idea)}
                                disabled={saving || !editForm.title.trim()}
                                className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
                              >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={() => { setEditId(null); setError(''); }}
                                className="px-4 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
