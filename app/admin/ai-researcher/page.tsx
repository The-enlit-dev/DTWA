'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, Plus, Trash2, Edit, CheckCircle, XCircle, Send, Loader2,
  AlertCircle, FlaskConical, ExternalLink, Save, Flag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

type Status = 'draft' | 'verified' | 'approved' | 'rejected' | 'published';

const STATUS_STYLES: Record<Status, string> = {
  draft: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  verified: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  approved: 'bg-green-500/15 text-green-400 border border-green-500/20',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
  published: 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25',
};

const EMPTY_FORM = {
  tool_name: '', website: '', category: '', description: '',
  features: '', target_audience: '', pricing: '', free_plan: '',
  platforms: '', use_cases: '', alternatives: '', source_urls: '',
};

export default function AdminAIResearcherPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('ai_tool_research')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const splitList = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);

  const save = async () => {
    if (!form.tool_name.trim()) {
      setError('Tool name is required.');
      return;
    }
    setSaving(true);
    setError('');

    // Prevent duplicates by checking tool_name (case-insensitive)
    const { data: existing } = await supabase
      .from('ai_tool_research')
      .select('id, tool_name')
      .ilike('tool_name', form.tool_name.trim());

    const dupe = (existing || []).find((e) => e.id !== editingId);
    if (dupe) {
      setSaving(false);
      setError(`A research item for "${form.tool_name}" already exists. Duplicate prevention is active.`);
      return;
    }

    const payload: any = {
      tool_name: form.tool_name.trim(),
      website: form.website,
      category: form.category,
      description: form.description,
      features: splitList(form.features),
      target_audience: form.target_audience,
      pricing: form.pricing,
      free_plan: form.free_plan,
      platforms: splitList(form.platforms),
      use_cases: splitList(form.use_cases),
      alternatives: splitList(form.alternatives),
      source_urls: splitList(form.source_urls),
    };

    if (editingId) {
      const { error: err } = await supabase.from('ai_tool_research').update(payload).eq('id', editingId);
      setSaving(false);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('ai_tool_research').insert(payload);
      setSaving(false);
      if (err) { setError(err.message); return; }
    }

    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
    fetch();
  };

  const edit = (item: any) => {
    setEditingId(item.id);
    setForm({
      tool_name: item.tool_name || '',
      website: item.website || '',
      category: item.category || '',
      description: item.description || '',
      features: (item.features || []).join(', '),
      target_audience: item.target_audience || '',
      pricing: item.pricing || '',
      free_plan: item.free_plan || '',
      platforms: (item.platforms || []).join(', '),
      use_cases: (item.use_cases || []).join(', '),
      alternatives: (item.alternatives || []).join(', '),
      source_urls: (item.source_urls || []).join(', '),
    });
    setShowForm(true);
  };

  const updateStatus = async (id: string, status: Status) => {
    const updates: any = { status };
    if (status === 'verified') updates.last_verified_date = new Date().toISOString();
    const { error: err } = await supabase.from('ai_tool_research').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const toggleReview = async (id: string, current: boolean) => {
    const { error: err } = await supabase.from('ai_tool_research').update({ needs_review: !current }).eq('id', id);
    if (err) { setError(err.message); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, needs_review: !current } : i)));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this research item? This cannot be undone.')) return;
    const { error: err } = await supabase.from('ai_tool_research').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.tool_name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.website?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-brand-blue" /> AI Tool Researcher
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Draft queue for researched AI tools</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...EMPTY_FORM }); setError(''); }}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" /> {editingId ? 'Cancel Edit' : 'Add Research Target'}
        </button>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">{editingId ? 'Edit Research Item' : 'New Research Target'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tool Name *</label>
              <input type="text" value={form.tool_name} onChange={(e) => setForm((p) => ({ ...p, tool_name: e.target.value }))} placeholder="e.g. ChatGPT" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="LLM / Image Gen / etc." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Target Audience</label>
              <input type="text" value={form.target_audience} onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value }))} placeholder="Developers / Marketers" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pricing</label>
              <input type="text" value={form.pricing} onChange={(e) => setForm((p) => ({ ...p, pricing: e.target.value }))} placeholder="$20/mo, Freemium" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Free Plan</label>
              <input type="text" value={form.free_plan} onChange={(e) => setForm((p) => ({ ...p, free_plan: e.target.value }))} placeholder="Yes / No / Limited" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Short description of the tool" className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Features (comma-separated)</label>
              <input type="text" value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} placeholder="Chat, code completion, vision" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Platforms (comma-separated)</label>
              <input type="text" value={form.platforms} onChange={(e) => setForm((p) => ({ ...p, platforms: e.target.value }))} placeholder="Web, iOS, Android" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Use Cases (comma-separated)</label>
              <input type="text" value={form.use_cases} onChange={(e) => setForm((p) => ({ ...p, use_cases: e.target.value }))} placeholder="Content creation, coding" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Alternatives (comma-separated)</label>
              <input type="text" value={form.alternatives} onChange={(e) => setForm((p) => ({ ...p, alternatives: e.target.value }))} placeholder="Claude, Gemini" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Source URLs (comma-separated)</label>
              <input type="text" value={form.source_urls} onChange={(e) => setForm((p) => ({ ...p, source_urls: e.target.value }))} placeholder="https://..., https://..." className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Add'} Research
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tool name, category, or website..."
          className={`${inputClass} pl-11`}
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tool</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Review</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Added</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No research items found.</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-medium">{item.tool_name}</p>
                  {item.website && (
                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue/70 hover:text-brand-blue flex items-center gap-1 mt-0.5">
                      <ExternalLink className="w-3 h-3" /> {item.website.replace(/^https?:\/\//, '').slice(0, 30)}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{item.category || '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[item.status as Status]}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <button
                    onClick={() => toggleReview(item.id, item.needs_review)}
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                      item.needs_review
                        ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    <Flag className="w-3 h-3" /> {item.needs_review ? 'Needs Review' : 'OK'}
                  </button>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <button
                      onClick={() => updateStatus(item.id, 'verified')}
                      disabled={item.status === 'verified' || item.status === 'approved' || item.status === 'published'}
                      title="Verify"
                      className="p-1.5 text-gray-500 hover:text-blue-400 rounded-lg hover:bg-blue-400/10 disabled:opacity-30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'approved')}
                      disabled={item.status === 'approved' || item.status === 'published'}
                      title="Approve"
                      className="p-1.5 text-gray-500 hover:text-green-400 rounded-lg hover:bg-green-400/10 disabled:opacity-30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'rejected')}
                      disabled={item.status === 'rejected'}
                      title="Reject"
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 disabled:opacity-30"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, 'published')}
                      disabled={item.status === 'published'}
                      title="Publish"
                      className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 disabled:opacity-30"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => edit(item)}
                      title="Edit"
                      className="p-1.5 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-yellow-400/10"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => del(item.id)}
                      title="Delete"
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10"
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
  );
}
