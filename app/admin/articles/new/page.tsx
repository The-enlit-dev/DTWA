'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Eye,
  Sparkles,
  FileText,
  Search,
  Image as ImageIcon,
  FolderTree,
  Send,
  Calendar,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BlogEditor, { type Block } from '@/components/admin/BlogEditor';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

type SidebarTab = 'content' | 'seo' | 'featured' | 'organization' | 'publishing';

export default function NewArticlePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    featured_alt: '',
    featured_caption: '',
    category_id: '',
    status: 'draft' as 'draft' | 'pending_review' | 'published',
    read_time: 5,
    tags: '',
    author_id: '',
    seo_title: '',
    meta_description: '',
    primary_keyword: '',
    secondary_keywords: '',
    canonical_url: '',
    published_at: '',
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState<string>('user');
  const [activeTab, setActiveTab] = useState<SidebarTab>('content');
  const [aiLoading, setAiLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  // --------------------- Load supporting data ---------------------
  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
    supabase
      .from('profiles')
      .select('id, username, full_name, role')
      .in('role', ['admin', 'super_admin', 'editor'])
      .order('full_name')
      .then(({ data }) => setAuthors(data || []));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setForm((p) => ({ ...p, author_id: user.id }));
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => setUserRole(data?.role || 'user'));
      }
    });
  }, []);

  // --------------------- Auto-slug from title ---------------------
  useEffect(() => {
    if (form.title && !slugTouched) {
      setForm((p) => ({ ...p, slug: slugify(p.title) }));
    }
  }, [form.title, slugTouched]);

  const isAdmin = ['admin', 'super_admin'].includes(userRole);

  const set = useCallback(
    (field: string) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value;
        setForm((p) => ({ ...p, [field]: value }));
        if (field === 'slug') setSlugTouched(true);
      },
    []
  );

  // --------------------- Block change ---------------------
  const handleBlocksChange = useCallback((next: Block[]) => {
    setBlocks(next);
  }, []);

  // --------------------- AI click ---------------------
  const handleAIClick = useCallback(
    async (action: string) => {
      if (!form.title && blocks.length === 0) {
        setError('Add some content before using AI tools.');
        return;
      }
      setAiLoading(true);
      setError('');
      try {
        const articleContext = JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          blocks,
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, content: articleContext }),
          }
        );
        if (!res.ok) throw new Error(`AI request failed (${res.status})`);
        const data = await res.json();

        // Apply suggestions to the most relevant field for the action
        if (action === 'title' && data.title) {
          setForm((p) => ({ ...p, title: data.title, slug: slugTouched ? p.slug : slugify(data.title) }));
        } else if (action === 'seo') {
          setForm((p) => ({
            ...p,
            seo_title: data.seo_title || p.seo_title,
            meta_description: data.meta_description || p.meta_description,
            primary_keyword: data.primary_keyword || p.primary_keyword,
          }));
        } else if (action === 'summary' && data.summary) {
          setForm((p) => ({ ...p, excerpt: data.summary }));
        } else if ((action === 'simplify' || action === 'improve') && data.content) {
          setForm((p) => ({ ...p, content: data.content }));
          setSuccess('AI returned updated content — review it in the content field.');
        }
        if (data.message) setSuccess(data.message);
      } catch (err: any) {
        setError(err.message || 'AI generation failed. Please try again.');
      } finally {
        setAiLoading(false);
      }
    },
    [form.title, form.excerpt, blocks, slugTouched]
  );

  // --------------------- Save ---------------------
  const handleSave = async (targetStatus: 'draft' | 'published') => {
    if (!form.title || !form.slug) {
      setError('Title and slug are required.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    // Editors cannot publish directly — goes to pending_review
    const finalStatus =
      !isAdmin && targetStatus === 'published' ? 'pending_review' : targetStatus;

    const { data: { user } } = await supabase.auth.getUser();
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const secondaryKeywords = form.secondary_keywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      featured_image: form.featured_image,
      category_id: form.category_id || null,
      status: finalStatus,
      read_time: Number(form.read_time),
      tags,
      author_id: form.author_id || user?.id || null,
      published_at:
        finalStatus === 'published'
          ? form.published_at
            ? new Date(form.published_at).toISOString()
            : new Date().toISOString()
          : null,
      seo_title: form.seo_title,
      meta_description: form.meta_description,
      primary_keyword: form.primary_keyword,
      secondary_keywords: secondaryKeywords,
      canonical_url: form.canonical_url,
      blocks: blocks as unknown as Record<string, unknown>,
    };

    const { error: err } = await supabase.from('articles').insert(payload);

    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/admin/articles');
  };

  // --------------------- Styling ---------------------
  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

  const tabs: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'featured', label: 'Featured', icon: ImageIcon },
    { id: 'organization', label: 'Organization', icon: FolderTree },
    { id: 'publishing', label: 'Publishing', icon: Send },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/articles"
          className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-xl text-white">New Article</h1>
          <p className="text-gray-500 text-sm">Block-based editor</p>
        </div>
        {aiLoading && (
          <div className="flex items-center gap-2 text-xs text-brand-blue">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI working...
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ---------------- Main column ---------------- */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title / slug / excerpt */}
          <div className="glass rounded-xl p-5 space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Article title..."
                className={`${inputClass} text-base font-medium`}
              />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={set('slug')}
                placeholder="article-slug"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={set('excerpt')}
                placeholder="Brief description shown in listings..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Block editor */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-blue" />
              <h2 className="text-sm font-semibold text-white">Content Blocks</h2>
            </div>
            <BlogEditor
              initialBlocks={blocks}
              onChange={handleBlocksChange}
              onAIClick={handleAIClick}
            />
          </div>
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <div className="space-y-4">
          {/* Tab switcher */}
          <div className="glass rounded-xl p-1.5">
            <div className="grid grid-cols-5 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-all ${
                      active
                        ? 'bg-brand-blue/15 text-brand-blue'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:block">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab panels */}
          <div className="glass rounded-xl p-5 space-y-4">
            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <>
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand-blue" /> SEO Settings
                </h3>
                <div>
                  <label className={labelClass}>
                    SEO Title <span className="text-gray-600">({form.seo_title.length}/60)</span>
                  </label>
                  <input
                    type="text"
                    value={form.seo_title}
                    onChange={set('seo_title')}
                    maxLength={70}
                    placeholder="Leave blank to use article title"
                    className={inputClass}
                  />
                  {form.seo_title.length > 60 && (
                    <p className="text-xs text-yellow-400 mt-1">Consider keeping under 60 characters.</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    Meta Description{' '}
                    <span className="text-gray-600">({form.meta_description.length}/160)</span>
                  </label>
                  <textarea
                    value={form.meta_description}
                    onChange={set('meta_description')}
                    rows={3}
                    maxLength={170}
                    placeholder="Leave blank to use excerpt"
                    className={`${inputClass} resize-none`}
                  />
                  {form.meta_description.length > 160 && (
                    <p className="text-xs text-yellow-400 mt-1">Consider keeping under 160 characters.</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Primary Keyword</label>
                  <input
                    type="text"
                    value={form.primary_keyword}
                    onChange={set('primary_keyword')}
                    placeholder="e.g. AI tools for productivity"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Secondary Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={form.secondary_keywords}
                    onChange={set('secondary_keywords')}
                    placeholder="ai writing, automation, productivity"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Canonical URL (optional)</label>
                  <input
                    type="url"
                    value={form.canonical_url}
                    onChange={set('canonical_url')}
                    placeholder="https://decodingtomorrowwithattharva.netlify.app/blog/..."
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* FEATURED TAB */}
            {activeTab === 'featured' && (
              <>
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand-blue" /> Featured Image
                </h3>
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input
                    type="url"
                    value={form.featured_image}
                    onChange={set('featured_image')}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                {form.featured_image && (
                  <div className="rounded-lg overflow-hidden h-40 bg-brand-800">
                    <img
                      src={form.featured_image}
                      alt="Featured preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Alt Text</label>
                  <input
                    type="text"
                    value={form.featured_alt}
                    onChange={set('featured_alt')}
                    placeholder="Describe the image for accessibility"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Caption (optional)</label>
                  <input
                    type="text"
                    value={form.featured_caption}
                    onChange={set('featured_caption')}
                    placeholder="Image caption..."
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* ORGANIZATION TAB */}
            {activeTab === 'organization' && (
              <>
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-brand-blue" /> Organization
                </h3>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={form.category_id}
                    onChange={set('category_id')}
                    className={inputClass}
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-brand-800">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={set('tags')}
                    placeholder="ai, tools, review"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Author</label>
                  <select
                    value={form.author_id}
                    onChange={set('author_id')}
                    className={inputClass}
                  >
                    <option value="">Select author</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id} className="bg-brand-800">
                        {a.full_name || a.username} ({a.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Read Time (minutes)</label>
                  <input
                    type="number"
                    value={form.read_time}
                    onChange={set('read_time')}
                    min={1}
                    max={60}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {/* PUBLISHING TAB */}
            {activeTab === 'publishing' && (
              <>
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-blue" /> Publishing
                </h3>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={set('status')}
                    className={inputClass}
                  >
                    <option value="draft" className="bg-brand-800">Draft</option>
                    <option value="pending_review" className="bg-brand-800">Pending Review</option>
                    <option value="published" className="bg-brand-800">Published</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Publish Date</label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    />
                    <input
                      type="datetime-local"
                      value={form.published_at}
                      onChange={set('published_at')}
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">
                    Leave blank to publish immediately when status is set to Published.
                  </p>
                </div>
              </>
            )}

            {/* CONTENT TAB — pointer to main column */}
            {activeTab === 'content' && (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Content is in the main column</p>
                <p className="text-xs text-gray-600 mt-1">
                  Use the block editor on the left to compose your article. Add the title, slug, and
                  excerpt at the top.
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => handleSave('published')}
              disabled={loading}
              className="w-full btn-gradient py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              {isAdmin ? 'Publish' : 'Submit for Review'}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="w-full py-3 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 transition-colors text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
