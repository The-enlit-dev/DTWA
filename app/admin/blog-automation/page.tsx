'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Rss, Plus, Trash2, Edit, CheckCircle, XCircle, Send, Loader2,
  AlertCircle, ExternalLink, Save, Globe, FileText, Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

type DiscoveryStatus = 'discovered' | 'drafted' | 'approved' | 'rejected' | 'published';

const DISCOVERY_STATUS_STYLES: Record<DiscoveryStatus, string> = {
  discovered: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  drafted: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  approved: 'bg-green-500/15 text-green-400 border border-green-500/20',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
  published: 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25',
};

const EMPTY_SOURCE = {
  name: '', url: '', source_type: 'rss', category: '', is_active: true, frequency_hours: 24,
};

export default function AdminBlogAutomationPage() {
  const [tab, setTab] = useState<'sources' | 'discoveries'>('sources');
  const [sources, setSources] = useState<any[]>([]);
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Source form state
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState({ ...EMPTY_SOURCE });

  // Discovery state
  const [viewingDiscovery, setViewingDiscovery] = useState<any | null>(null);
  const [editingDraft, setEditingDraft] = useState<any | null>(null);
  const [draftText, setDraftText] = useState('');
  const [discoveryFilter, setDiscoveryFilter] = useState<DiscoveryStatus | 'all'>('all');

  const fetch = async () => {
    setLoading(true);
    const [srcRes, discRes] = await Promise.all([
      supabase.from('blog_sources').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('blog_discoveries').select('*, source:blog_sources(name)').order('discovered_at', { ascending: false }).limit(200),
    ]);
    if (srcRes.error) setError(srcRes.error.message);
    if (discRes.error) setError(discRes.error.message);
    setSources(srcRes.data || []);
    setDiscoveries(discRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  // ---- Source CRUD ----
  const saveSource = async () => {
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) {
      setError('Source name and URL are required.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: sourceForm.name.trim(),
      url: sourceForm.url.trim(),
      source_type: sourceForm.source_type,
      category: sourceForm.category,
      is_active: sourceForm.is_active,
      frequency_hours: Number(sourceForm.frequency_hours) || 24,
    };
    if (editingSourceId) {
      const { error: err } = await supabase.from('blog_sources').update(payload).eq('id', editingSourceId);
      setSaving(false);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('blog_sources').insert(payload);
      setSaving(false);
      if (err) { setError(err.message); return; }
    }
    setSourceForm({ ...EMPTY_SOURCE });
    setEditingSourceId(null);
    setShowSourceForm(false);
    fetch();
  };

  const editSource = (s: any) => {
    setEditingSourceId(s.id);
    setSourceForm({
      name: s.name, url: s.url, source_type: s.source_type || 'rss',
      category: s.category || '', is_active: s.is_active, frequency_hours: s.frequency_hours || 24,
    });
    setShowSourceForm(true);
  };

  const delSource = async (id: string) => {
    if (!confirm('Delete this source? Related discoveries will also be deleted.')) return;
    const { error: err } = await supabase.from('blog_sources').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setSources((prev) => prev.filter((s) => s.id !== id));
    fetch();
  };

  // ---- Discovery actions ----
  const updateDiscoveryStatus = async (id: string, status: DiscoveryStatus) => {
    const { error: err } = await supabase.from('blog_discoveries').update({ status }).eq('id', id);
    if (err) { setError(err.message); return; }
    setDiscoveries((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const saveDraft = async () => {
    if (!editingDraft) return;
    const { error: err } = await supabase
      .from('blog_discoveries')
      .update({ ai_draft: draftText, status: 'drafted' })
      .eq('id', editingDraft.id);
    if (err) { setError(err.message); return; }
    setDiscoveries((prev) => prev.map((d) => (d.id === editingDraft.id ? { ...d, ai_draft: draftText, status: 'drafted' } : d)));
    setEditingDraft(null);
    setDraftText('');
  };

  const delDiscovery = async (id: string) => {
    if (!confirm('Delete this discovery?')) return;
    const { error: err } = await supabase.from('blog_discoveries').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setDiscoveries((prev) => prev.filter((d) => d.id !== id));
  };

  const filteredDiscoveries = discoveryFilter === 'all'
    ? discoveries
    : discoveries.filter((d) => d.status === discoveryFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Rss className="w-5 h-5 text-brand-blue" /> Blog Automation
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage content sources and discoveries</p>
        </div>
        {tab === 'sources' && (
          <button
            onClick={() => { setShowSourceForm(!showSourceForm); setEditingSourceId(null); setSourceForm({ ...EMPTY_SOURCE }); setError(''); }}
            className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" /> {editingSourceId ? 'Cancel Edit' : 'Add Source'}
          </button>
        )}
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('sources')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'sources' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}
        >
          Sources ({sources.length})
        </button>
        <button
          onClick={() => setTab('discoveries')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'discoveries' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}
        >
          Discoveries ({discoveries.length})
        </button>
      </div>

      {/* ============ SOURCES TAB ============ */}
      {tab === 'sources' && (
        <>
          {showSourceForm && (
            <div className="glass rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-white">{editingSourceId ? 'Edit Source' : 'New Source'}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                  <input type="text" value={sourceForm.name} onChange={(e) => setSourceForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. TechCrunch AI" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">URL *</label>
                  <input type="url" value={sourceForm.url} onChange={(e) => setSourceForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://feeds.example.com/rss" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Source Type</label>
                  <select value={sourceForm.source_type} onChange={(e) => setSourceForm((p) => ({ ...p, source_type: e.target.value }))} className={inputClass}>
                    <option value="rss">RSS</option>
                    <option value="api">API</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Category</label>
                  <input type="text" value={sourceForm.category} onChange={(e) => setSourceForm((p) => ({ ...p, category: e.target.value }))} placeholder="AI / Tech / Research" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Frequency (hours)</label>
                  <input type="number" value={sourceForm.frequency_hours} onChange={(e) => setSourceForm((p) => ({ ...p, frequency_hours: Number(e.target.value) }))} min={1} className={inputClass} />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer pt-6">
                    <input type="checkbox" checked={sourceForm.is_active} onChange={(e) => setSourceForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-brand-blue" />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveSource} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingSourceId ? 'Update' : 'Add'} Source
                </button>
                <button onClick={() => { setShowSourceForm(false); setEditingSourceId(null); setSourceForm({ ...EMPTY_SOURCE }); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="glass rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Freq</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Last Fetched</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : sources.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">No sources yet. Add an RSS feed to get started.</td></tr>
                ) : sources.map((s) => (
                  <tr key={s.id} className="hover:bg-white/2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-brand-blue" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white">{s.name}</p>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-blue flex items-center gap-1 truncate max-w-[200px]">
                            <ExternalLink className="w-3 h-3" /> {s.url.replace(/^https?:\/\//, '').slice(0, 30)}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border border-white/10 text-gray-400">{s.source_type}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">{s.category || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">{s.frequency_hours}h</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'}`}>
                        {s.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                      {s.last_fetched_at ? formatDistanceToNow(new Date(s.last_fetched_at), { addSuffix: true }) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => editSource(s)} className="p-1.5 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-yellow-400/10">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => delSource(s.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ DISCOVERIES TAB ============ */}
      {tab === 'discoveries' && (
        <>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'discovered', 'drafted', 'approved', 'rejected', 'published'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setDiscoveryFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  discoveryFilter === s ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Draft editor modal */}
          {editingDraft && (
            <div className="glass rounded-xl p-5 space-y-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm">Edit Draft — {editingDraft.title}</h3>
                <button onClick={() => { setEditingDraft(null); setDraftText(''); }} className="text-gray-400 hover:text-white text-xs">Close</button>
              </div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={10}
                placeholder="Write or paste the blog draft here..."
                className={`${inputClass} resize-y font-mono text-xs`}
              />
              <div className="flex gap-2">
                <button onClick={saveDraft} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm">
                  <Save className="w-4 h-4" /> Save Draft
                </button>
                <button onClick={() => { setEditingDraft(null); setDraftText(''); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* View modal */}
          {viewingDiscovery && (
            <div className="glass rounded-xl p-5 space-y-4 border border-brand-blue/20">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-blue" /> {viewingDiscovery.title}
                </h3>
                <button onClick={() => setViewingDiscovery(null)} className="text-gray-400 hover:text-white text-xs">Close</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-500">Source:</span> <span className="text-gray-300">{viewingDiscovery.source?.name || '—'}</span></div>
                <div><span className="text-gray-500">Author:</span> <span className="text-gray-300">{viewingDiscovery.author || '—'}</span></div>
                <div><span className="text-gray-500">Published:</span> <span className="text-gray-300">{viewingDiscovery.published_at ? new Date(viewingDiscovery.published_at).toLocaleDateString() : '—'}</span></div>
                <div><span className="text-gray-500">Discovered:</span> <span className="text-gray-300">{formatDistanceToNow(new Date(viewingDiscovery.discovered_at), { addSuffix: true })}</span></div>
              </div>
              {viewingDiscovery.url && (
                <a href={viewingDiscovery.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:underline">
                  <ExternalLink className="w-3.5 h-3.5" /> Open original article
                </a>
              )}
              {viewingDiscovery.excerpt && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Excerpt</p>
                  <p className="text-sm text-gray-300">{viewingDiscovery.excerpt}</p>
                </div>
              )}
              {viewingDiscovery.ai_draft && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">AI Draft</p>
                  <div className="bg-brand-900/50 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {viewingDiscovery.ai_draft}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discoveries list */}
          {loading ? (
            <div className="text-center py-10 text-gray-500 glass rounded-xl">Loading...</div>
          ) : filteredDiscoveries.length === 0 ? (
            <div className="text-center py-10 glass rounded-xl">
              <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">No discoveries found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDiscoveries.map((d) => (
                <div key={d.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{d.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {d.source?.name && <span className="text-xs text-gray-500">{d.source.name}</span>}
                        {d.url && (
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue/70 hover:text-brand-blue flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Source
                          </a>
                        )}
                        <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(d.discovered_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${DISCOVERY_STATUS_STYLES[d.status as DiscoveryStatus]}`}>
                      {d.status}
                    </span>
                  </div>

                  {d.excerpt && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{d.excerpt}</p>}

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setViewingDiscovery(d)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/10">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => { setEditingDraft(d); setDraftText(d.ai_draft || ''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Draft
                    </button>
                    <button
                      onClick={() => updateDiscoveryStatus(d.id, 'approved')}
                      disabled={d.status === 'approved' || d.status === 'published'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded-lg text-xs hover:bg-green-500/20 disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => updateDiscoveryStatus(d.id, 'rejected')}
                      disabled={d.status === 'rejected'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => updateDiscoveryStatus(d.id, 'published')}
                      disabled={d.status === 'published'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 text-brand-blue rounded-lg text-xs hover:bg-brand-blue/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                    <button
                      onClick={() => delDiscovery(d.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
