'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Loader2,
  AlertCircle,
  X as XIcon,
  Check,
  Edit,
  FileText,
  Cpu,
  Building2,
  BookOpen,
  GitCompare,
  Save,
} from 'lucide-react';

const inputClass =
  'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const SEO_TITLE_MAX = 60;
const META_DESC_MAX = 160;

type TabKey = 'articles' | 'ai_tools' | 'companies' | 'glossary_terms' | 'tool_comparisons';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: any;
  titleField: string;
  slugField: string;
  hasCanonical: boolean;
}

const tabs: TabConfig[] = [
  { key: 'articles', label: 'Articles', icon: FileText, titleField: 'title', slugField: 'slug', hasCanonical: true },
  { key: 'ai_tools', label: 'AI Tools', icon: Cpu, titleField: 'name', slugField: 'slug', hasCanonical: false },
  { key: 'companies', label: 'Companies', icon: Building2, titleField: 'name', slugField: 'slug', hasCanonical: false },
  { key: 'glossary_terms', label: 'Glossary', icon: BookOpen, titleField: 'term', slugField: 'slug', hasCanonical: false },
  { key: 'tool_comparisons', label: 'Comparisons', icon: GitCompare, titleField: 'title', slugField: 'slug', hasCanonical: true },
];

interface SEORow {
  id: string;
  title: string;
  slug: string;
  seo_title: string;
  meta_description: string;
  canonical_url: string;
}

export default function AdminSEOPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('articles');
  const [rows, setRows] = useState<SEORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    seo_title: string;
    meta_description: string;
    canonical_url: string;
  }>({ seo_title: '', meta_description: '', canonical_url: '' });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const currentTab = useMemo(
    () => tabs.find((t) => t.key === activeTab)!,
    [activeTab]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const selectFields = currentTab.hasCanonical
      ? `id, ${currentTab.titleField}, ${currentTab.slugField}, seo_title, meta_description, canonical_url`
      : `id, ${currentTab.titleField}, ${currentTab.slugField}, seo_title, meta_description`;
    const { data, error: err } = await supabase
      .from(activeTab)
      .select(selectFields)
      .order(currentTab.titleField, { ascending: true })
      .limit(200);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows(
        (data || []).map((r: any) => ({
          id: r.id,
          title: r[currentTab.titleField],
          slug: r[currentTab.slugField],
          seo_title: r.seo_title || '',
          meta_description: r.meta_description || '',
          canonical_url: r.canonical_url || '',
        }))
      );
    }
    setLoading(false);
  }, [activeTab, currentTab]);

  useEffect(() => {
    load();
    setEditingId(null);
    setSearch('');
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.seo_title.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const startEdit = (row: SEORow) => {
    setEditingId(row.id);
    setEditValues({
      seo_title: row.seo_title,
      meta_description: row.meta_description,
      canonical_url: row.canonical_url,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ seo_title: '', meta_description: '', canonical_url: '' });
  };

  const saveEdit = async (row: SEORow) => {
    setSavingId(row.id);
    setError('');
    const payload: Record<string, string> = {
      seo_title: editValues.seo_title,
      meta_description: editValues.meta_description,
    };
    if (currentTab.hasCanonical) {
      payload.canonical_url = editValues.canonical_url;
    }
    const { error: err } = await supabase
      .from(activeTab)
      .update(payload)
      .eq('id', row.id);
    setSavingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              seo_title: editValues.seo_title,
              meta_description: editValues.meta_description,
              canonical_url: editValues.canonical_url,
            }
          : r
      )
    );
    setEditingId(null);
    setSavedId(row.id);
    setTimeout(() => setSavedId(null), 2000);
  };

  const charCount = (text: string, max: number) => {
    const len = text.length;
    const color =
      len === 0
        ? 'text-gray-600'
        : len <= max
        ? 'text-green-400'
        : 'text-red-400';
    return (
      <span className={`text-xs ${color}`}>
        {len}/{max}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-brand-blue" /> SEO Manager
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Centralized SEO management for all publishable content
        </p>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-blue text-white'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${currentTab.label.toLowerCase()}...`}
          className={`${inputClass} pl-10`}
        />
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                {currentTab.label === 'Glossary'
                  ? 'Term'
                  : currentTab.label === 'Comparisons'
                  ? 'Title'
                  : currentTab.titleField === 'title'
                  ? 'Title'
                  : 'Name'}
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                SEO Title{' '}
                <span className="text-gray-600 normal-case">(max {SEO_TITLE_MAX})</span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[250px]">
                Meta Description{' '}
                <span className="text-gray-600 normal-case">
                  (max {META_DESC_MAX})
                </span>
              </th>
              {currentTab.hasCanonical && (
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px] hidden xl:table-cell">
                  Canonical URL
                </th>
              )}
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr>
                <td
                  colSpan={currentTab.hasCanonical ? 5 : 4}
                  className="text-center py-12"
                >
                  <Loader2 className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={currentTab.hasCanonical ? 5 : 4}
                  className="text-center py-12"
                >
                  <currentTab.icon
                    className="w-10 h-10 text-gray-600 mx-auto mb-3"
                  />
                  <p className="text-gray-500">
                    {search
                      ? `No ${currentTab.label.toLowerCase()} match your search.`
                      : `No ${currentTab.label.toLowerCase()} found.`}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isEditing = editingId === row.id;
                const isSaving = savingId === row.id;
                const justSaved = savedId === row.id;
                return (
                  <tr key={row.id} className="hover:bg-white/2 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">
                        {row.title}
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">
                        /{row.slug}
                      </div>
                    </td>

                    {/* SEO Title */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editValues.seo_title}
                            onChange={(e) =>
                              setEditValues((p) => ({
                                ...p,
                                seo_title: e.target.value,
                              }))
                            }
                            placeholder={row.title}
                            className={`${inputClass} text-xs py-2`}
                          />
                          {charCount(editValues.seo_title, SEO_TITLE_MAX)}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-sm text-gray-300">
                            {row.seo_title || (
                              <span className="text-gray-600 italic">
                                Not set
                              </span>
                            )}
                          </div>
                          {charCount(row.seo_title, SEO_TITLE_MAX)}
                        </div>
                      )}
                    </td>

                    {/* Meta Description */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="space-y-1">
                          <textarea
                            value={editValues.meta_description}
                            onChange={(e) =>
                              setEditValues((p) => ({
                                ...p,
                                meta_description: e.target.value,
                              }))
                            }
                            rows={2}
                            placeholder="Meta description..."
                            className={`${inputClass} text-xs py-2 resize-none`}
                          />
                          {charCount(
                            editValues.meta_description,
                            META_DESC_MAX
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-sm text-gray-300 line-clamp-2">
                            {row.meta_description || (
                              <span className="text-gray-600 italic">
                                Not set
                              </span>
                            )}
                          </div>
                          {charCount(row.meta_description, META_DESC_MAX)}
                        </div>
                      )}
                    </td>

                    {/* Canonical URL */}
                    {currentTab.hasCanonical && (
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.canonical_url}
                            onChange={(e) =>
                              setEditValues((p) => ({
                                ...p,
                                canonical_url: e.target.value,
                              }))
                            }
                            placeholder="https://..."
                            className={`${inputClass} text-xs py-2`}
                          />
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">
                            {row.canonical_url || (
                              <span className="text-gray-600 italic">
                                Not set
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(row)}
                              disabled={isSaving}
                              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                              title="Save"
                            >
                              {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:bg-white/8 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : justSaved ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors"
                            title="Edit SEO"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Showing {filtered.length} {currentTab.label.toLowerCase()}
          {filtered.length === 1 ? '' : 's'}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  );
}
