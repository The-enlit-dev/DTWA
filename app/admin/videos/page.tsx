'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Eye, Youtube } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', youtube_id: '', description: '', category: '', duration: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('videos').select('*').order('published_at', { ascending: false }).limit(50);
    setVideos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!form.title || !form.youtube_id) return;
    setSaving(true);
    const { error } = await supabase.from('videos').insert({ ...form, view_count: 0 });
    setSaving(false);
    if (!error) { setForm({ title: '', youtube_id: '', description: '', category: '', duration: '' }); setShowForm(false); fetch(); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    await supabase.from('videos').delete().eq('id', id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-xl text-white">Videos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Video
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold text-white">New Video</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm(p => ({...p, title: e.target.value}))} placeholder="Video title" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">YouTube ID *</label>
              <input type="text" value={form.youtube_id} onChange={(e) => setForm(p => ({...p, youtube_id: e.target.value}))} placeholder="dQw4w9WgXcQ" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value}))} placeholder="AI Tools / Companies / etc." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Duration</label>
              <input type="text" value={form.duration} onChange={(e) => setForm(p => ({...p, duration: e.target.value}))} placeholder="18:32" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({...p, description: e.target.value}))} rows={3} className={`${inputClass} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Video'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Category</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Views</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : videos.map((v) => (
              <tr key={v.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <img src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`} alt="" className="w-12 h-9 rounded object-cover" />
                    <p className="text-sm text-white line-clamp-1">{v.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{v.category}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {v.view_count}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <a href={`https://youtube.com/watch?v=${v.youtube_id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                      <Youtube className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => del(v.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10">
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
