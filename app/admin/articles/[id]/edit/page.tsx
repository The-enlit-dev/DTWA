'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('articles').select('*').eq('id', params.id).maybeSingle(),
      supabase.from('categories').select('*'),
    ]).then(([articleRes, catRes]) => {
      if (articleRes.data) {
        setForm({
          ...articleRes.data,
          tags: (articleRes.data.tags || []).join(', '),
          secondary_keywords: (articleRes.data.secondary_keywords || []).join(', '),
        });
      }
      setCategories(catRes.data || []);
      setFetching(false);
    });
  }, [params.id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p: any) => ({ ...p, [field]: e.target.value }));

  const handleSave = async (status = form.status) => {
    if (!form.title || !form.slug) { setError('Title and slug required.'); return; }
    setLoading(true);
    setError('');

    const tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    const { error: err } = await supabase.from('articles').update({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      featured_image: form.featured_image,
      category_id: form.category_id || null,
      status,
      read_time: Number(form.read_time),
      tags,
      published_at: status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
      updated_at: new Date().toISOString(),
      seo_title: form.seo_title || '',
      meta_description: form.meta_description || '',
      primary_keyword: form.primary_keyword || '',
      secondary_keywords: (form.secondary_keywords || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      canonical_url: form.canonical_url || '',
    }).eq('id', params.id);

    setLoading(false);
    if (err) { setError(err.message); return; }
    router.push('/admin/articles');
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';
  const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

  if (fetching) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>;
  if (!form) return <div className="text-gray-500 py-20 text-center">Article not found.</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/articles" className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-display font-bold text-xl text-white">Edit Article</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass rounded-xl p-5 space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input type="text" value={form.title} onChange={set('title')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Slug *</label>
              <input type="text" value={form.slug} onChange={set('slug')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Excerpt</label>
              <textarea value={form.excerpt} onChange={set('excerpt')} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Content</label>
              <textarea value={form.content} onChange={set('content')} rows={20} className={`${inputClass} resize-y font-mono text-xs`} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-sm">Settings</h3>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category_id || ''} onChange={set('category_id')} className={inputClass}>
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Read Time (minutes)</label>
              <input type="number" value={form.read_time} onChange={set('read_time')} min={1} max={60} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input type="text" value={form.tags} onChange={set('tags')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Featured Image URL</label>
              <input type="url" value={form.featured_image || ''} onChange={set('featured_image')} placeholder="https://..." className={inputClass} />
            </div>
          </div>

          {/* SEO section */}
          <div className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setSeoOpen(!seoOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/4 transition-colors"
            >
              SEO Settings
              {seoOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {seoOpen && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/8 pt-4">
                <div>
                  <label className={labelClass}>SEO Title <span className="text-gray-600">({(form.seo_title || '').length}/60)</span></label>
                  <input type="text" value={form.seo_title || ''} onChange={set('seo_title')} placeholder="Leave blank to use article title" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Meta Description <span className="text-gray-600">({(form.meta_description || '').length}/160)</span></label>
                  <textarea value={form.meta_description || ''} onChange={set('meta_description')} rows={3} placeholder="Leave blank to use excerpt" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Primary Keyword</label>
                  <input type="text" value={form.primary_keyword || ''} onChange={set('primary_keyword')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Secondary Keywords (comma-separated)</label>
                  <input type="text" value={form.secondary_keywords || ''} onChange={set('secondary_keywords')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Canonical URL (optional)</label>
                  <input type="url" value={form.canonical_url || ''} onChange={set('canonical_url')} placeholder="https://decodingtomorrowwithattharva.netlify.app/blog/..." className={inputClass} />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="space-y-2">
            <button onClick={() => handleSave('published')} disabled={loading} className="w-full btn-gradient py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
              <Eye className="w-4 h-4" /> {form.status === 'published' ? 'Update' : 'Publish'}
            </button>
            <button onClick={() => handleSave('draft')} disabled={loading} className="w-full py-3 text-gray-300 font-medium rounded-xl flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 transition-colors text-sm">
              <Save className="w-4 h-4" /> Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
