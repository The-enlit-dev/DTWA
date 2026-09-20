'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Edit, Search, X, Save, Eye, EyeOff, Download,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Tag, BookOpen,
  Loader2, Shield, Users,
} from 'lucide-react';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

const CATEGORIES = [
  'Foundations','Models','Architecture','Training','Usage','Infrastructure',
  'Capabilities','Limitations','Parameters','Ethics & Safety','Ecosystem',
  'Applications','Research','Evaluation','General',
];

const EMPTY_FORM = {
  term: '', slug: '', category: 'General', status: 'draft' as 'draft' | 'published',
  simple_explanation: '', detailed_explanation: '', example: '',
  tags: '', related_term_slugs: '',
  seo_title: '', meta_description: '', primary_keyword: '', secondary_keywords: '',
  faq_raw: '', // JSON string for FAQs
};

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [forceCreate, setForceCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPerms, setShowPerms] = useState(false);
  const [editors, setEditors] = useState<any[]>([]);
  const [glossaryEditors, setGlossaryEditors] = useState<string[]>([]);
  const [seoOpen, setSeoOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  const fetchTerms = useCallback(async () => {
    const { data } = await supabase
      .from('glossary_terms')
      .select('id, term, slug, category, status, view_count, updated_at, simple_explanation')
      .order('term', { ascending: true });
    setTerms(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTerms(); }, [fetchTerms]);

  useEffect(() => {
    if (showPerms) {
      supabase.from('profiles').select('id, username, email:id, role').not('role', 'in', '(admin,super_admin)').then(({ data }) => setEditors(data || []));
      supabase.from('editor_permissions').select('user_id').eq('content_type', 'glossary').then(({ data }) => setGlossaryEditors((data || []).map((d: any) => d.user_id)));
    }
  }, [showPerms]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (field === 'term' && !editId) setForm((p) => ({ ...p, slug: slugify(e.target.value) }));
    if (field === 'term' || field === 'slug') { setDuplicateWarning(null); setForceCreate(false); }
  };

  const checkDuplicates = useCallback((termVal: string, slugVal: string): string | null => {
    const termLower = termVal.toLowerCase().trim();
    for (const t of terms) {
      if (t.id === editId) continue;
      if (t.slug === slugVal) return `A term with slug "${slugVal}" already exists: "${t.term}"`;
      if (t.term.toLowerCase() === termLower) return `A term with the same name already exists: "${t.term}"`;
      if (levenshtein(t.term.toLowerCase(), termLower) <= 2)
        return `A very similar term exists: "${t.term}" — are you sure this is different?`;
    }
    return null;
  }, [terms, editId]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDuplicateWarning(null);
    setForceCreate(false);
    setSaveError('');
    setSaveSuccess('');
    setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const { data } = await supabase.from('glossary_terms').select('*').eq('id', id).maybeSingle();
    if (!data) return;
    setForm({
      term: data.term,
      slug: data.slug,
      category: data.category,
      status: data.status,
      simple_explanation: data.simple_explanation || '',
      detailed_explanation: data.detailed_explanation || '',
      example: data.example || '',
      tags: (data.tags || []).join(', '),
      related_term_slugs: (data.related_term_slugs || []).join(', '),
      seo_title: data.seo_title || '',
      meta_description: data.meta_description || '',
      primary_keyword: data.primary_keyword || '',
      secondary_keywords: (data.secondary_keywords || []).join(', '),
      faq_raw: data.faq?.length ? JSON.stringify(data.faq, null, 2) : '',
    });
    setEditId(id);
    setDuplicateWarning(null);
    setForceCreate(false);
    setSaveError('');
    setSaveSuccess('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.term.trim()) { setSaveError('Term name is required.'); return; }
    if (!form.simple_explanation.trim()) { setSaveError('Simple explanation is required.'); return; }

    // Duplicate check
    if (!forceCreate) {
      const warning = checkDuplicates(form.term, form.slug);
      if (warning) { setDuplicateWarning(warning); return; }
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    let faqParsed: any[] = [];
    if (form.faq_raw.trim()) {
      try { faqParsed = JSON.parse(form.faq_raw); } catch { setSaveError('FAQ must be valid JSON array.'); setSaving(false); return; }
    }

    const payload = {
      term: form.term.trim(),
      slug: form.slug || slugify(form.term),
      category: form.category,
      status: form.status,
      simple_explanation: form.simple_explanation.trim(),
      detailed_explanation: form.detailed_explanation.trim(),
      example: form.example.trim() || null,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      related_term_slugs: form.related_term_slugs.split(',').map((s) => s.trim()).filter(Boolean),
      seo_title: form.seo_title.trim(),
      meta_description: form.meta_description.trim(),
      primary_keyword: form.primary_keyword.trim(),
      secondary_keywords: form.secondary_keywords.split(',').map((s) => s.trim()).filter(Boolean),
      faq: faqParsed,
      published_at: form.status === 'published' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = editId
      ? await supabase.from('glossary_terms').update(payload).eq('id', editId)
      : await supabase.from('glossary_terms').insert(payload);

    setSaving(false);
    if (error) { setSaveError(error.message); return; }

    setSaveSuccess(editId ? 'Term updated.' : 'Term created.');
    setShowForm(false);
    fetchTerms();
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleDelete = async (id: string, termName: string) => {
    if (!confirm(`Delete "${termName}"? This cannot be undone.`)) return;
    setDeleting(id);
    await supabase.from('glossary_terms').delete().eq('id', id);
    setTerms((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'published' ? 'draft' : 'published';
    await supabase.from('glossary_terms').update({ status: next, updated_at: new Date().toISOString() }).eq('id', id);
    setTerms((prev) => prev.map((t) => t.id === id ? { ...t, status: next } : t));
  };

  const toggleEditorPermission = async (userId: string) => {
    if (glossaryEditors.includes(userId)) {
      await supabase.from('editor_permissions').delete().eq('user_id', userId).eq('content_type', 'glossary');
      setGlossaryEditors((prev) => prev.filter((id) => id !== userId));
    } else {
      await supabase.from('editor_permissions').insert({ user_id: userId, content_type: 'glossary' });
      setGlossaryEditors((prev) => [...prev, userId]);
    }
  };

  const exportCSV = () => {
    const headers = ['term', 'slug', 'category', 'status', 'simple_explanation'];
    const rows = filteredTerms.map((t) => [
      `"${t.term}"`, `"${t.slug}"`, `"${t.category}"`, `"${t.status}"`, `"${t.simple_explanation?.replace(/"/g, '""')}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'glossary-terms.csv'; a.click();
  };

  const filteredTerms = terms.filter((t) => {
    const matchSearch = !search || t.term.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-blue" /> Glossary Manager
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{terms.length} terms · {terms.filter((t) => t.status === 'published').length} published</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPerms(!showPerms)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
            <Shield className="w-4 h-4" /> Permissions
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
            <Plus className="w-4 h-4" /> Add Term
          </button>
        </div>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {saveSuccess}
        </div>
      )}

      {/* Permissions panel */}
      {showPerms && (
        <div className="glass rounded-2xl border border-white/8 p-5 mb-6">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-brand-blue" /> Glossary Editor Permissions
          </h3>
          <p className="text-xs text-gray-500 mb-4">Grant editors permission to create and edit glossary terms.</p>
          {editors.length === 0 ? (
            <p className="text-sm text-gray-500">No editors found. Add users with the editor role first.</p>
          ) : (
            <div className="space-y-2">
              {editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
                  <div>
                    <p className="text-sm text-white">{editor.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{editor.role}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-400">{glossaryEditors.includes(editor.id) ? 'Granted' : 'Not granted'}</span>
                    <div
                      onClick={() => toggleEditorPermission(editor.id)}
                      className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${glossaryEditors.includes(editor.id) ? 'bg-brand-blue' : 'bg-white/15'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${glossaryEditors.includes(editor.id) ? 'translate-x-5' : ''}`} />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">{editId ? 'Edit Term' : 'New Glossary Term'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {duplicateWarning && (
            <div className="flex flex-col gap-3 p-4 mb-5 bg-orange-500/10 border border-orange-500/25 rounded-xl">
              <div className="flex items-start gap-2 text-orange-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {duplicateWarning}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setDuplicateWarning(null); setForceCreate(true); handleSave(); }} className="text-xs px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                  Create anyway
                </button>
                <button onClick={() => setDuplicateWarning(null)} className="text-xs px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Term Name *</label>
              <input type="text" value={form.term} onChange={set('term')} placeholder="e.g. Retrieval-Augmented Generation" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input type="text" value={form.slug} onChange={set('slug')} placeholder="auto-generated" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={set('category')} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Simple Explanation * <span className="text-gray-600 font-normal">(shown on index page + quick definition)</span></label>
              <textarea value={form.simple_explanation} onChange={set('simple_explanation')} placeholder="Plain language definition in 1-2 sentences..." rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Detailed Explanation <span className="text-gray-600 font-normal">(shown on individual page)</span></label>
              <textarea value={form.detailed_explanation} onChange={set('detailed_explanation')} placeholder="In-depth explanation with context, nuance..." rows={5} className={`${inputClass} resize-y`} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Example</label>
              <input type="text" value={form.example} onChange={set('example')} placeholder="A real-world example..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tags <span className="text-gray-600 font-normal">(comma-separated)</span></label>
              <input type="text" value={form.tags} onChange={set('tags')} placeholder="llm, training, fine-tuning" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Related Term Slugs <span className="text-gray-600 font-normal">(comma-separated)</span></label>
              <input type="text" value={form.related_term_slugs} onChange={set('related_term_slugs')} placeholder="transformer, embedding, rag" className={inputClass} />
            </div>
          </div>

          {/* SEO accordion */}
          <button onClick={() => setSeoOpen(!seoOpen)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3 transition-colors w-full">
            {seoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            SEO Fields
            <div className="flex-1 border-t border-white/8 ml-2" />
          </button>
          {seoOpen && (
            <div className="grid sm:grid-cols-2 gap-4 mb-4 p-4 bg-white/3 rounded-xl border border-white/6">
              <div className="sm:col-span-2">
                <label className={labelClass}>SEO Title <span className="text-gray-600">(~60 chars)</span></label>
                <input type="text" value={form.seo_title} onChange={set('seo_title')} placeholder="What is RAG (Retrieval-Augmented Generation)? | AI Glossary" className={inputClass} />
                <p className="text-xs text-gray-600 mt-1">{form.seo_title.length}/60 chars</p>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Meta Description <span className="text-gray-600">(~160 chars)</span></label>
                <textarea value={form.meta_description} onChange={set('meta_description')} placeholder="RAG explained simply. Learn how retrieval-augmented generation works..." rows={3} className={`${inputClass} resize-none`} />
                <p className="text-xs text-gray-600 mt-1">{form.meta_description.length}/160 chars</p>
              </div>
              <div>
                <label className={labelClass}>Primary Keyword</label>
                <input type="text" value={form.primary_keyword} onChange={set('primary_keyword')} placeholder="retrieval augmented generation" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Secondary Keywords <span className="text-gray-600">(comma-separated)</span></label>
                <input type="text" value={form.secondary_keywords} onChange={set('secondary_keywords')} placeholder="RAG definition, RAG vs fine-tuning" className={inputClass} />
              </div>
            </div>
          )}

          {/* FAQ accordion */}
          <button onClick={() => setFaqOpen(!faqOpen)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-3 transition-colors w-full">
            {faqOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            FAQ (JSON)
            <div className="flex-1 border-t border-white/8 ml-2" />
          </button>
          {faqOpen && (
            <div className="mb-4">
              <label className={labelClass}>FAQ JSON Array <span className="text-gray-600">[&#123;"question":"...","answer":"..."&#125;]</span></label>
              <textarea value={form.faq_raw} onChange={set('faq_raw')} rows={6} placeholder={'[\n  {"question": "What is RAG?", "answer": "RAG stands for..."}\n]'} className={`${inputClass} resize-y font-mono text-xs`} />
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-white/8">
            <select value={form.status} onChange={set('status')} className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 btn-gradient text-white text-sm font-medium rounded-xl disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Update Term' : 'Create Term'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-gray-400 hover:text-white text-sm border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              Cancel
            </button>
            {saveError && <p className="text-red-400 text-xs ml-2">{saveError}</p>}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms or slugs..."
            className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><X className="w-4 h-4" /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-brand-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Terms table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
      ) : (
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs text-gray-500">{filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="divide-y divide-white/6">
            {filteredTerms.length === 0 && (
              <div className="text-center py-16 text-gray-500 text-sm">No terms found.</div>
            )}
            {filteredTerms.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate">{t.term}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${t.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-mono">/glossary/{t.slug}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{t.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleStatus(t.id, t.status)}
                    title={t.status === 'published' ? 'Unpublish' : 'Publish'}
                    className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
                  >
                    {t.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => openEdit(t.id)} className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.term)}
                    disabled={deleting === t.id}
                    className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                  >
                    {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
