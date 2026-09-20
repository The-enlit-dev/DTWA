'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, ExternalLink, BookOpen, Eye, Download, X, Save, Loader2, FolderPlus, Tag } from 'lucide-react';
import Link from 'next/link';

export default function AdminLearningHubPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'resources' | 'categories'>('resources');

  const [form, setForm] = useState({
    title: '', slug: '', description: '', category_id: '', tags: '',
    file_url: '', file_type: 'pdf', thumbnail_url: '', is_published: false,
  });

  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', icon: 'BookOpen' });

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const fetchAll = async () => {
    const [resRes, catRes] = await Promise.all([
      supabase.from('learning_resources').select('*, category:learning_categories(name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('learning_categories').select('*').order('sort_order', { ascending: true }),
    ]);
    setResources(resRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      title: form.title,
      slug: form.slug || slugify(form.title),
      description: form.description,
      category_id: form.category_id || null,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      file_url: form.file_url,
      file_type: form.file_type,
      thumbnail_url: form.thumbnail_url,
      is_published: form.is_published,
    };

    if (editingId) {
      await supabase.from('learning_resources').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      if (user) payload.author_id = user.id;
      await supabase.from('learning_resources').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', slug: '', description: '', category_id: '', tags: '', file_url: '', file_type: 'pdf', thumbnail_url: '', is_published: false });
    fetchAll();
  };

  const edit = (r: any) => {
    setEditingId(r.id);
    setForm({
      title: r.title, slug: r.slug, description: r.description || '',
      category_id: r.category_id || '', tags: (r.tags || []).join(', '),
      file_url: r.file_url || '', file_type: r.file_type || 'pdf',
      thumbnail_url: r.thumbnail_url || '', is_published: r.is_published,
    });
    setShowForm(true);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return;
    await supabase.from('learning_resources').delete().eq('id', id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const saveCategory = async () => {
    if (!catForm.name) return;
    setSaving(true);
    await supabase.from('learning_categories').insert({
      name: catForm.name,
      slug: catForm.slug || slugify(catForm.name),
      description: catForm.description,
      icon: catForm.icon,
      sort_order: categories.length + 1,
    });
    setSaving(false);
    setShowCategoryForm(false);
    setCatForm({ name: '', slug: '', description: '', icon: 'BookOpen' });
    fetchAll();
  };

  const delCategory = async (id: string) => {
    if (!confirm('Delete this category? Resources in it will become uncategorized.')) return;
    await supabase.from('learning_categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-xl text-white">Learning Hub</h1>
        {tab === 'resources' ? (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        ) : (
          <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('resources')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'resources' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}>
          Resources ({resources.length})
        </button>
        <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'categories' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}>
          Categories ({categories.length})
        </button>
      </div>

      {/* Resource form */}
      {showForm && tab === 'resources' && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">{editingId ? 'Edit Resource' : 'New Resource'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className={inputClass}>
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">File Type</label>
              <select value={form.file_type} onChange={(e) => setForm((p) => ({ ...p, file_type: e.target.value }))} className={inputClass}>
                <option value="pdf">PDF</option>
                <option value="ppt">PPT</option>
                <option value="pptx">PPTX</option>
                <option value="doc">DOC</option>
                <option value="docx">DOCX</option>
                <option value="image">Image</option>
                <option value="link">External Link</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">File URL (or external link)</label>
              <input type="url" value={form.file_url} onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Thumbnail URL (optional)</label>
              <input type="url" value={form.thumbnail_url} onChange={(e) => setForm((p) => ({ ...p, thumbnail_url: e.target.value }))} placeholder="https://..." className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="AI, ML, neural networks" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} className="w-4 h-4 rounded accent-brand-blue" />
                <span className="text-sm text-gray-300">Published (visible to public)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Add'} Resource
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Category form */}
      {showCategoryForm && tab === 'categories' && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">New Category</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input type="text" value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <input type="text" value={catForm.slug} onChange={(e) => setCatForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icon (Lucide name)</label>
              <input type="text" value={catForm.icon} onChange={(e) => setCatForm((p) => ({ ...p, icon: e.target.value }))} placeholder="BookOpen" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input type="text" value={catForm.description} onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveCategory} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add Category
            </button>
            <button onClick={() => setShowCategoryForm(false)} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Content */}
      {tab === 'resources' ? (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Stats</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/4">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : resources.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No resources yet.</td></tr>
              ) : resources.map((r) => (
                <tr key={r.id} className="hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{r.title}</p>
                    <p className="text-xs text-gray-600 truncate max-w-xs">{r.description}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{r.category?.name || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border border-white/10 text-gray-400">{r.file_type}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{r.view_count}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{r.download_count}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.is_published ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Published</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/learning-hub/${r.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => edit(r)} className="p-1.5 text-gray-500 hover:text-yellow-400 rounded-lg hover:bg-yellow-400/10">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(r.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="glass rounded-xl p-4 border border-white/8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                  <p className="text-[10px] text-gray-600 mt-2">/{cat.slug}</p>
                </div>
                <button onClick={() => delCategory(cat.id)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500 text-sm">No categories yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
