'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Image as ImageIcon, Plus, Trash2, Edit, Search, Loader2, AlertCircle,
  Save, X, FileText, Film, File, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

const EMPTY_FORM = {
  name: '', url: '', alt_text: '', caption: '', category: '', tags: '', file_type: 'image',
};

const FILE_TYPE_ICONS: Record<string, any> = {
  image: ImageIcon,
  video: Film,
  document: FileText,
  other: File,
};

export default function AdminMediaLibraryPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetch = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    setAssets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach((a) => { if (a.category) cats.add(a.category); });
    return Array.from(cats).sort();
  }, [assets]);

  const filtered = assets.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.alt_text?.toLowerCase().includes(q) || (a.tags || []).some((t: string) => t.toLowerCase().includes(q));
  });

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      setError('Name and URL are required.');
      return;
    }
    setSaving(true);
    setError('');

    const payload: any = {
      name: form.name.trim(),
      original_name: form.name.trim(),
      url: form.url.trim(),
      file_type: form.file_type,
      alt_text: form.alt_text,
      caption: form.caption,
      category: form.category,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };

    if (editingId) {
      const { error: err } = await supabase.from('media_assets').update(payload).eq('id', editingId);
      setSaving(false);
      if (err) { setError(err.message); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.uploaded_by = user.id;
      const { error: err } = await supabase.from('media_assets').insert(payload);
      setSaving(false);
      if (err) { setError(err.message); return; }
    }

    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(false);
    fetch();
  };

  const edit = (asset: any) => {
    setEditingId(asset.id);
    setForm({
      name: asset.name || '',
      url: asset.url || '',
      alt_text: asset.alt_text || '',
      caption: asset.caption || '',
      category: asset.category || '',
      tags: (asset.tags || []).join(', '),
      file_type: asset.file_type || 'image',
    });
    setShowForm(true);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this media asset? This cannot be undone.')) return;
    const { error: err } = await supabase.from('media_assets').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const FileTypeIcon = ({ type }: { type: string }) => {
    const Icon = FILE_TYPE_ICONS[type] || File;
    return <Icon className="w-6 h-6 text-gray-500" />;
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-blue" /> Media Library
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{assets.length} assets</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...EMPTY_FORM }); setError(''); }}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" /> {editingId ? 'Cancel Edit' : 'Add Media'}
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
          <h3 className="font-semibold text-white">{editingId ? 'Edit Media Asset' : 'New Media Asset'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. AI hero banner" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL *</label>
              <input type="url" value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">File Type</label>
              <select value={form.file_type} onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))} className={inputClass}>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Hero / Blog / Icon" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Alt Text</label>
              <input type="text" value={form.alt_text} onChange={(e) => setForm((p) => ({ ...p, alt_text: e.target.value }))} placeholder="Descriptive alt text for accessibility" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="ai, banner, hero" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Caption</label>
              <input type="text" value={form.caption} onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))} placeholder="Optional caption" className={inputClass} />
            </div>
          </div>

          {/* Preview */}
          {form.url && isImageUrl(form.url) && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Preview</p>
              <img src={form.url} alt={form.alt_text || form.name} className="max-h-40 rounded-lg border border-white/10 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Add'} Asset
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY_FORM }); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, alt text, or tags..."
            className={`${inputClass} pl-11`}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={`${inputClass} w-auto min-w-[150px]`}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 glass rounded-xl">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl">
          <ImageIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No media assets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset) => (
            <div key={asset.id} className="glass rounded-xl overflow-hidden group">
              {/* Thumbnail */}
              <div className="aspect-square bg-brand-900/50 relative overflow-hidden">
                {isImageUrl(asset.url) ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileTypeIcon type={asset.file_type} />
                  </div>
                )}
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => edit(asset)}
                    className="p-2 bg-white/10 hover:bg-yellow-400/20 rounded-lg text-white hover:text-yellow-400 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => del(asset.id)}
                    className="p-2 bg-white/10 hover:bg-red-400/20 rounded-lg text-white hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {/* File type badge */}
                <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/50 text-gray-300 backdrop-blur-sm">
                  {asset.file_type}
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm text-white font-medium truncate">{asset.name}</p>
                {asset.category && (
                  <span className="text-xs text-brand-blue/70 mt-0.5 block">{asset.category}</span>
                )}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1.5">
                    {asset.tags.slice(0, 3).map((tag: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{tag}</span>
                    ))}
                    {asset.tags.length > 3 && <span className="text-[10px] text-gray-600">+{asset.tags.length - 3}</span>}
                  </div>
                )}
                <p className="text-[10px] text-gray-600 mt-1.5">{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
