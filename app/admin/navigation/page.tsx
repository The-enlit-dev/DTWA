'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Menu,
  Plus,
  Trash2,
  Edit,
  Check,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const inputClass =
  'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

interface NavItem {
  id: string;
  label: string;
  url: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  icon: string;
  created_at?: string;
}

const emptyForm = {
  label: '',
  url: '',
  icon: '',
  parent_id: '' as string,
  is_visible: true,
};

export default function AdminNavigationPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('nav_menu_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (err) setError(err.message);
    setItems((data || []) as NavItem[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const parents = useMemo(() => items.filter((i) => !i.parent_id), [items]);

  // Build a hierarchical list: parents first, then their children indented
  const hierarchical = useMemo(() => {
    const result: { item: NavItem; depth: number }[] = [];
    const topLevel = items
      .filter((i) => !i.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    for (const parent of topLevel) {
      result.push({ item: parent, depth: 0 });
      const children = items
        .filter((i) => i.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      for (const child of children) {
        result.push({ item: child, depth: 1 });
      }
    }
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return hierarchical;
    const q = search.toLowerCase();
    return hierarchical.filter(({ item }) =>
      item.label.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
    );
  }, [hierarchical, search]);

  const add = async () => {
    if (!form.label.trim() || !form.url.trim()) return;
    setSaving(true);
    setError('');
    const maxOrder = items.length
      ? Math.max(...items.map((i) => i.sort_order || 0))
      : 0;
    const { error: err } = await supabase.from('nav_menu_items').insert({
      label: form.label.trim(),
      url: form.url.trim(),
      icon: form.icon.trim(),
      parent_id: form.parent_id || null,
      sort_order: maxOrder + 1,
      is_visible: form.is_visible,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  };

  const startEdit = (item: NavItem) => {
    setEditId(item.id);
    setEditForm({
      label: item.label,
      url: item.url,
      icon: item.icon || '',
      parent_id: item.parent_id || '',
      is_visible: item.is_visible,
    });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError('');
    const { error: err } = await supabase
      .from('nav_menu_items')
      .update({
        label: editForm.label.trim(),
        url: editForm.url.trim(),
        icon: editForm.icon.trim(),
        parent_id: editForm.parent_id || null,
        is_visible: editForm.is_visible,
      })
      .eq('id', id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEditId(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this menu item? Children will become top-level.')) return;
    const { error: err } = await supabase
      .from('nav_menu_items')
      .delete()
      .eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    // Also un-parent any children
    await supabase
      .from('nav_menu_items')
      .update({ parent_id: null })
      .eq('parent_id', id);
    load();
  };

  const toggleVisible = async (item: NavItem) => {
    await supabase
      .from('nav_menu_items')
      .update({ is_visible: !item.is_visible })
      .eq('id', item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_visible: !i.is_visible } : i))
    );
  };

  const reorder = async (item: NavItem, direction: 'up' | 'down') => {
    // Find siblings at the same level (same parent_id)
    const siblings = items
      .filter((i) => (i.parent_id || null) === (item.parent_id || null))
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((s) => s.id === item.id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === siblings.length - 1) return;
    const swap = siblings[direction === 'up' ? idx - 1 : idx + 1];
    // Swap sort_order values
    await Promise.all([
      supabase
        .from('nav_menu_items')
        .update({ sort_order: swap.sort_order })
        .eq('id', item.id),
      supabase
        .from('nav_menu_items')
        .update({ sort_order: item.sort_order })
        .eq('id', swap.id),
    ]);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Menu className="w-5 h-5 text-brand-blue" /> Navigation
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {items.length} menu items
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 flex-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400/50 hover:text-red-400"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="glass rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">New Menu Item</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Label *</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. AI Tools"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL *</label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="/tools or https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Icon Name (Lucide)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. Cpu, Home, Tag"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Parent Item</label>
              <select
                value={form.parent_id}
                onChange={(e) =>
                  setForm({ ...form, parent_id: e.target.value })
                }
                className={inputClass}
              >
                <option value="">None (top level)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) =>
                setForm({ ...form, is_visible: e.target.checked })
              }
              className="accent-brand-blue w-4 h-4"
            />
            <span className="text-sm text-gray-300">Visible</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving || !form.label.trim() || !form.url.trim()}
              className="btn-gradient px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Item'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by label or URL..."
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* List */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Menu className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? 'No items match your search.' : 'No menu items yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Label
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  URL
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  Icon
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Order
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Visible
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {filtered.map(({ item, depth }) => (
                <tr key={item.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${depth * 24}px` }}
                    >
                      {depth > 0 && (
                        <span className="text-gray-600 text-xs">└</span>
                      )}
                      {editId === item.id ? (
                        <input
                          type="text"
                          value={editForm.label}
                          onChange={(e) =>
                            setEditForm({ ...editForm, label: e.target.value })
                          }
                          className={`${inputClass} w-40`}
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {item.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {editId === item.id ? (
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) =>
                          setEditForm({ ...editForm, url: e.target.value })
                        }
                        className={`${inputClass} w-40`}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 font-mono">
                        {item.url}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {editId === item.id ? (
                      <input
                        type="text"
                        value={editForm.icon}
                        onChange={(e) =>
                          setEditForm({ ...editForm, icon: e.target.value })
                        }
                        placeholder="icon name"
                        className={`${inputClass} w-28`}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 font-mono">
                        {item.icon || '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => reorder(item, 'up')}
                        className="p-1 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reorder(item, 'down')}
                        className="p-1 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleVisible(item)}
                      className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"
                      title={item.is_visible ? 'Visible' : 'Hidden'}
                    >
                      {item.is_visible ? (
                        <Eye className="w-4 h-4 text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {editId === item.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-1.5 text-gray-400 hover:bg-white/8 rounded-lg transition-colors"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => del(item.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
