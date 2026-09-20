'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Save,
  Loader2,
  Search,
  Check,
  Sparkles,
  Wand2,
  Newspaper,
  Wrench,
  BookOpen,
  FileText,
  Lightbulb,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface DailyContent {
  id?: string;
  content_date: string;
  ai_update: string;
  ai_update_source: string;
  tool_of_day_id: string;
  tool_of_day_name: string;
  term_of_day_slug: string;
  term_of_day_name: string;
  article_of_day_slug: string;
  article_of_day_title: string;
  prompt_of_day: string;
  prompt_of_day_category: string;
  is_published: boolean;
}

interface SearchableItem {
  id: string;
  label: string;
  sublabel?: string;
  slug: string;
}

const emptyForm: DailyContent = {
  content_date: '',
  ai_update: '',
  ai_update_source: '',
  tool_of_day_id: '',
  tool_of_day_name: '',
  term_of_day_slug: '',
  term_of_day_name: '',
  article_of_day_slug: '',
  article_of_day_title: '',
  prompt_of_day: '',
  prompt_of_day_category: '',
  is_published: false,
};

export default function AdminDailyPage() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [form, setForm] = useState<DailyContent>({ ...emptyForm, content_date: todayStr });
  const [existingId, setExistingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Search states for each selector
  const [toolSearch, setToolSearch] = useState('');
  const [toolResults, setToolResults] = useState<SearchableItem[]>([]);
  const [toolSearching, setToolSearching] = useState(false);
  const [showToolResults, setShowToolResults] = useState(false);

  const [termSearch, setTermSearch] = useState('');
  const [termResults, setTermResults] = useState<SearchableItem[]>([]);
  const [termSearching, setTermSearching] = useState(false);
  const [showTermResults, setShowTermResults] = useState(false);

  const [articleSearch, setArticleSearch] = useState('');
  const [articleResults, setArticleResults] = useState<SearchableItem[]>([]);
  const [articleSearching, setArticleSearching] = useState(false);
  const [showArticleResults, setShowArticleResults] = useState(false);

  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [autoFilling, setAutoFilling] = useState(false);

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  // ============================================
  // LOAD TODAY'S CONTENT
  // ============================================
  useEffect(() => {
    let active = true;
    (async () => {
      // Load today's entry
      const { data: todayEntry } = await supabase
        .from('daily_content')
        .select('*')
        .eq('content_date', todayStr)
        .maybeSingle();

      if (!active) return;

      if (todayEntry) {
        setExistingId(todayEntry.id);
        setForm({
          content_date: todayEntry.content_date,
          ai_update: todayEntry.ai_update || '',
          ai_update_source: todayEntry.ai_update_source || '',
          tool_of_day_id: todayEntry.tool_of_day_id || '',
          tool_of_day_name: todayEntry.tool_of_day_name || '',
          term_of_day_slug: todayEntry.term_of_day_slug || '',
          term_of_day_name: todayEntry.term_of_day_name || '',
          article_of_day_slug: todayEntry.article_of_day_slug || '',
          article_of_day_title: todayEntry.article_of_day_title || '',
          prompt_of_day: todayEntry.prompt_of_day || '',
          prompt_of_day_category: todayEntry.prompt_of_day_category || '',
          is_published: todayEntry.is_published || false,
        });
      }

      // Load recent entries
      const { data: recent } = await supabase
        .from('daily_content')
        .select('*')
        .order('content_date', { ascending: false })
        .limit(10);

      if (!active) return;
      setRecentEntries(recent || []);
      setLoadingRecent(false);
    })();
    return () => {
      active = false;
    };
  }, [todayStr]);

  // ============================================
  // SEARCH FUNCTIONS (debounced via simple effect)
  // ============================================
  useEffect(() => {
    if (!toolSearch.trim()) {
      setToolResults([]);
      return;
    }
    setToolSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('ai_tools')
        .select('id, name, slug, category')
        .or(`name.ilike.%${toolSearch}%,slug.ilike.%${toolSearch}%`)
        .limit(8);
      setToolResults(
        (data || []).map((t: any) => ({
          id: t.id,
          label: t.name,
          sublabel: t.category,
          slug: t.slug,
        }))
      );
      setToolSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [toolSearch]);

  useEffect(() => {
    if (!termSearch.trim()) {
      setTermResults([]);
      return;
    }
    setTermSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('glossary_terms')
        .select('id, term, slug, category')
        .or(`term.ilike.%${termSearch}%,slug.ilike.%${termSearch}%`)
        .limit(8);
      setTermResults(
        (data || []).map((g: any) => ({
          id: g.id,
          label: g.term,
          sublabel: g.category,
          slug: g.slug,
        }))
      );
      setTermSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [termSearch]);

  useEffect(() => {
    if (!articleSearch.trim()) {
      setArticleResults([]);
      return;
    }
    setArticleSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('articles')
        .select('id, title, slug')
        .eq('status', 'published')
        .or(`title.ilike.%${articleSearch}%,slug.ilike.%${articleSearch}%`)
        .limit(8);
      setArticleResults(
        (data || []).map((a: any) => ({
          id: a.id,
          label: a.title,
          slug: a.slug,
        }))
      );
      setArticleSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [articleSearch]);

  // ============================================
  // SAVE
  // ============================================
  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);

    const payload = {
      content_date: form.content_date,
      ai_update: form.ai_update,
      ai_update_source: form.ai_update_source,
      tool_of_day_id: form.tool_of_day_id,
      tool_of_day_name: form.tool_of_day_name,
      term_of_day_slug: form.term_of_day_slug,
      term_of_day_name: form.term_of_day_name,
      article_of_day_slug: form.article_of_day_slug,
      article_of_day_title: form.article_of_day_title,
      prompt_of_day: form.prompt_of_day,
      prompt_of_day_category: form.prompt_of_day_category,
      is_published: form.is_published,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      const { error } = await supabase
        .from('daily_content')
        .update(payload)
        .eq('id', existingId);
      if (error) {
        setSavedMsg(`Error: ${error.message}`);
      } else {
        setSavedMsg('Saved successfully!');
      }
    } else {
      const { data, error } = await supabase
        .from('daily_content')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        setSavedMsg(`Error: ${error.message}`);
      } else {
        setExistingId(data.id);
        setSavedMsg('Created successfully!');
      }
    }

    setSaving(false);
    setTimeout(() => setSavedMsg(null), 3000);

    // Refresh recent entries
    const { data: recent } = await supabase
      .from('daily_content')
      .select('*')
      .order('content_date', { ascending: false })
      .limit(10);
    setRecentEntries(recent || []);
  };

  // ============================================
  // AUTO-FILL
  // ============================================
  const handleAutoFill = async () => {
    setAutoFilling(true);

    const [articlesRes, toolsRes, termsRes] = await Promise.all([
      supabase
        .from('articles')
        .select('id, title, slug')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('ai_tools')
        .select('id, name, slug')
        .order('rating', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('glossary_terms')
        .select('id, term, slug')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setForm((prev) => ({
      ...prev,
      article_of_day_slug: articlesRes.data?.slug || '',
      article_of_day_title: articlesRes.data?.title || '',
      tool_of_day_id: toolsRes.data?.slug || toolsRes.data?.id || '',
      tool_of_day_name: toolsRes.data?.name || '',
      term_of_day_slug: termsRes.data?.slug || '',
      term_of_day_name: termsRes.data?.term || '',
    }));

    setAutoFilling(false);
    setSavedMsg('Auto-filled with latest content!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  // ============================================
  // SELECT HELPERS
  // ============================================
  const selectTool = (item: SearchableItem) => {
    setForm((p) => ({ ...p, tool_of_day_id: item.slug, tool_of_day_name: item.label }));
    setToolSearch('');
    setShowToolResults(false);
  };

  const selectTerm = (item: SearchableItem) => {
    setForm((p) => ({ ...p, term_of_day_slug: item.slug, term_of_day_name: item.label }));
    setTermSearch('');
    setShowTermResults(false);
  };

  const selectArticle = (item: SearchableItem) => {
    setForm((p) => ({ ...p, article_of_day_slug: item.slug, article_of_day_title: item.label }));
    setArticleSearch('');
    setShowArticleResults(false);
  };

  const clearTool = () => {
    setForm((p) => ({ ...p, tool_of_day_id: '', tool_of_day_name: '' }));
  };
  const clearTerm = () => {
    setForm((p) => ({ ...p, term_of_day_slug: '', term_of_day_name: '' }));
  };
  const clearArticle = () => {
    setForm((p) => ({ ...p, article_of_day_slug: '', article_of_day_title: '' }));
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const editEntry = (entry: any) => {
    setExistingId(entry.id);
    setForm({
      content_date: entry.content_date,
      ai_update: entry.ai_update || '',
      ai_update_source: entry.ai_update_source || '',
      tool_of_day_id: entry.tool_of_day_id || '',
      tool_of_day_name: entry.tool_of_day_name || '',
      term_of_day_slug: entry.term_of_day_slug || '',
      term_of_day_name: entry.term_of_day_name || '',
      article_of_day_slug: entry.article_of_day_slug || '',
      article_of_day_title: entry.article_of_day_title || '',
      prompt_of_day: entry.prompt_of_day || '',
      prompt_of_day_category: entry.prompt_of_day_category || '',
      is_published: entry.is_published || false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-orange" />
            </div>
            <h1 className="font-display font-bold text-xl text-white">Daily AI Hub</h1>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Today is{' '}
            <span className="text-gray-300 font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>
        <button
          onClick={handleAutoFill}
          disabled={autoFilling}
          className="inline-flex items-center gap-2 px-4 py-2.5 glass border border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          {autoFilling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Auto-fill from latest content
        </button>
      </div>

      {/* Saved message */}
      {savedMsg && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            savedMsg.startsWith('Error')
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}
        >
          {savedMsg}
        </div>
      )}

      {/* Form */}
      <div className="glass rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-base text-white">
            {existingId ? 'Edit Daily Content' : 'Create Daily Content'}
          </h2>
          {existingId && (
            <span className="text-xs text-gray-500">
              Date: {formatDate(form.content_date)}
            </span>
          )}
        </div>

        {/* AI Update */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-brand-blue" /> AI Update
          </label>
          <textarea
            value={form.ai_update}
            onChange={(e) => setForm((p) => ({ ...p, ai_update: e.target.value }))}
            rows={4}
            placeholder="Today's key AI news or development…"
            className={`${inputClass} resize-none`}
          />
          <input
            type="text"
            value={form.ai_update_source}
            onChange={(e) => setForm((p) => ({ ...p, ai_update_source: e.target.value }))}
            placeholder="Source (URL or name)"
            className={inputClass}
          />
        </div>

        {/* Tool of the Day */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-brand-purple" /> Tool of the Day
          </label>
          {form.tool_of_day_name ? (
            <div className="flex items-center justify-between bg-brand-blue/10 border border-brand-blue/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-blue" />
                <span className="text-sm text-white font-medium">{form.tool_of_day_name}</span>
                <span className="text-xs text-gray-500">/{form.tool_of_day_id}</span>
              </div>
              <button
                onClick={clearTool}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={toolSearch}
                onChange={(e) => {
                  setToolSearch(e.target.value);
                  setShowToolResults(true);
                }}
                onFocus={() => setShowToolResults(true)}
                placeholder="Search AI tools…"
                className={`${inputClass} pl-10`}
              />
              {toolSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />
              )}
              {showToolResults && toolResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  {toolResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTool(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-gray-500">{item.sublabel}</p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  ))}
                </div>
              )}
              {showToolResults && toolSearch && !toolSearching && toolResults.length === 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-500">
                  No tools found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Term of the Day */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-pink" /> Term of the Day
          </label>
          {form.term_of_day_name ? (
            <div className="flex items-center justify-between bg-brand-pink/10 border border-brand-pink/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-pink" />
                <span className="text-sm text-white font-medium">{form.term_of_day_name}</span>
                <span className="text-xs text-gray-500">/{form.term_of_day_slug}</span>
              </div>
              <button
                onClick={clearTerm}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={termSearch}
                onChange={(e) => {
                  setTermSearch(e.target.value);
                  setShowTermResults(true);
                }}
                onFocus={() => setShowTermResults(true)}
                placeholder="Search glossary terms…"
                className={`${inputClass} pl-10`}
              />
              {termSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />
              )}
              {showTermResults && termResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  {termResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTerm(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-xs text-gray-500">{item.sublabel}</p>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  ))}
                </div>
              )}
              {showTermResults && termSearch && !termSearching && termResults.length === 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-500">
                  No terms found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Article of the Day */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-orange" /> Article of the Day
          </label>
          {form.article_of_day_title ? (
            <div className="flex items-center justify-between bg-brand-orange/10 border border-brand-orange/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="w-4 h-4 text-brand-orange shrink-0" />
                <span className="text-sm text-white font-medium truncate">
                  {form.article_of_day_title}
                </span>
                <span className="text-xs text-gray-500 shrink-0">/{form.article_of_day_slug}</span>
              </div>
              <button
                onClick={clearArticle}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors shrink-0 ml-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => {
                  setArticleSearch(e.target.value);
                  setShowArticleResults(true);
                }}
                onFocus={() => setShowArticleResults(true)}
                placeholder="Search published articles…"
                className={`${inputClass} pl-10`}
              />
              {articleSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />
              )}
              {showArticleResults && articleResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 overflow-hidden max-h-60 overflow-y-auto">
                  {articleResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectArticle(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                    >
                      <p className="text-sm text-white truncate">{item.label}</p>
                      <Plus className="w-4 h-4 text-gray-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {showArticleResults && articleSearch && !articleSearching && articleResults.length === 0 && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-500">
                  No published articles found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prompt of the Day */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-green-400" /> Prompt of the Day
          </label>
          <textarea
            value={form.prompt_of_day}
            onChange={(e) => setForm((p) => ({ ...p, prompt_of_day: e.target.value }))}
            rows={3}
            placeholder="A prompt for users to try today…"
            className={`${inputClass} resize-none font-mono text-xs`}
          />
          <input
            type="text"
            value={form.prompt_of_day_category}
            onChange={(e) => setForm((p) => ({ ...p, prompt_of_day_category: e.target.value }))}
            placeholder="Category (e.g. Writing, Coding, Productivity)"
            className={inputClass}
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-center justify-between bg-brand-800/50 border border-white/8 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            {form.is_published ? (
              <Eye className="w-4 h-4 text-green-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-500" />
            )}
            <div>
              <p className="text-sm text-white font-medium">
                {form.is_published ? 'Published' : 'Draft'}
              </p>
              <p className="text-xs text-gray-500">
                {form.is_published
                  ? 'Visible on the public Daily AI Hub'
                  : 'Not visible publicly yet'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setForm((p) => ({ ...p, is_published: !p.is_published }))}
            className={`relative w-11 h-6 rounded-full transition-all ${
              form.is_published ? 'bg-brand-blue' : 'bg-white/10'
            }`}
            aria-label="Toggle published"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                form.is_published ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gradient inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {existingId ? 'Update Daily Content' : 'Save Daily Content'}
          </button>
          <span className="text-xs text-gray-500">
            {form.is_published ? 'Will be publicly visible' : 'Will be saved as draft'}
          </span>
        </div>
      </div>

      {/* Recent entries */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-base text-white">Recent Daily Content</h2>
        {loadingRecent ? (
          <div className="glass rounded-xl p-8 text-center text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            Loading recent entries…
          </div>
        ) : recentEntries.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-gray-500 text-sm">
            No daily content entries yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="glass rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">
                        {formatDate(entry.content_date)}
                      </p>
                      {entry.is_published ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {entry.ai_update
                        ? entry.ai_update.slice(0, 80) + (entry.ai_update.length > 80 ? '…' : '')
                        : entry.tool_of_day_name
                          ? `Tool: ${entry.tool_of_day_name}`
                          : entry.term_of_day_name
                            ? `Term: ${entry.term_of_day_name}`
                            : 'No content set'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => editEntry(entry)}
                  className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium shrink-0"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
