'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, Star, ExternalLink, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function AdminToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', short_description: '', category: '', website_url: '',
    rating: 4.0, pricing_model: 'freemium', pros: '', cons: '', tags: '', is_featured: false
  });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('ai_tools').select('*').order('created_at', { ascending: false }).limit(100);
    setTools(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const logoFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');
      return `https://logo.clearbit.com/${domain}`;
    } catch { return ''; }
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    const { error } = await supabase.from('ai_tools').insert({
      ...form,
      slug: form.slug || slugify(form.name),
      logo_url: form.website_url ? logoFromUrl(form.website_url) : '',
      pros: form.pros.split(',').map(s => s.trim()).filter(Boolean),
      cons: form.cons.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      rating: Number(form.rating),
    });
    setSaving(false);
    if (!error) { setShowForm(false); fetch(); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    await supabase.from('ai_tools').delete().eq('id', id);
    setTools(prev => prev.filter(t => t.id !== id));
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-white">AI Tools Directory</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Tool
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-white">New AI Tool</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <input type="text" value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))} placeholder="auto-generated" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Website URL</label>
              <input type="url" value={form.website_url} onChange={e => setForm(p => ({...p, website_url: e.target.value}))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rating (1-5)</label>
              <input type="number" value={form.rating} onChange={e => setForm(p => ({...p, rating: Number(e.target.value)}))} min={1} max={5} step={0.1} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pricing Model</label>
              <select value={form.pricing_model} onChange={e => setForm(p => ({...p, pricing_model: e.target.value}))} className={inputClass}>
                <option value="free">Free</option>
                <option value="freemium">Freemium</option>
                <option value="paid">Paid</option>
                <option value="open_source">Open Source</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Short Description</label>
              <textarea value={form.short_description} onChange={e => setForm(p => ({...p, short_description: e.target.value}))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pros (comma-separated)</label>
              <input type="text" value={form.pros} onChange={e => setForm(p => ({...p, pros: e.target.value}))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Cons (comma-separated)</label>
              <input type="text" value={form.cons} onChange={e => setForm(p => ({...p, cons: e.target.value}))} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Tool'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tool</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Rating</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : tools.map(t => (
              <tr key={t.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4 text-brand-blue" />
                    </div>
                    <p className="text-sm text-white">{t.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{t.category}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-white">{t.rating}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/tools/${t.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => del(t.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
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
