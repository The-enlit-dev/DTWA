'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit, Check, X as XIcon, Tag } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState('');

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  }

  const load = async () => {
    const { data } = await supabase.from('categories').select('*, articles(count)').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    const { error: err } = await supabase.from('categories').insert({
      name: newName.trim(),
      slug: slugify(newName),
      color: newColor,
    });
    setAdding(false);
    if (err) { setError(err.message); return; }
    setNewName('');
    setNewColor('#3b82f6');
    load();
  };

  const saveEdit = async (id: string) => {
    await supabase.from('categories').update({ name: editName, color: editColor, slug: slugify(editName) }).eq('id', id);
    setEditId(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this category? Articles using it will be uncategorized.')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  const inputClass = 'bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
      </div>

      {/* Add new */}
      <div className="glass rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-white text-sm mb-4">Add New Category</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1.5 block">Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="e.g. AI Research"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Color</label>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-[42px] w-16 rounded-xl border border-white/10 bg-brand-800 cursor-pointer p-1" />
          </div>
          <button
            onClick={add}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2.5 btn-gradient text-white font-medium rounded-xl text-sm disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* List */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Articles</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">No categories yet.</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  {editId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-8 w-10 rounded-lg border border-white/10 bg-brand-800 cursor-pointer p-0.5" />
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={`${inputClass} w-40`} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#3b82f6' }} />
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 font-mono">{cat.slug}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-400">
                  {cat.articles?.[0]?.count ?? 0} articles
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {editId === cat.id ? (
                      <>
                        <button onClick={() => saveEdit(cat.id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-white/8 rounded-lg transition-colors"><XIcon className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditColor(cat.color || '#3b82f6'); }} className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(cat.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
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
