'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, ExternalLink, Scale, X, ChevronUp, ChevronDown,
  Save, Edit, Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';

interface FeatureRow {
  feature: string;
  tool_a_value: string;
  tool_b_value: string;
}

interface PricingData {
  plan: string;
  price: string;
  details: string;
}

interface ComparisonForm {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  tool_a: string;
  tool_b: string;
  tool_a_slug: string;
  tool_b_slug: string;
  category: string;
  winner: 'tool_a' | 'tool_b' | 'tie';
  tags: string;
  recommendation: string;
  features: FeatureRow[];
  pros_a: string;
  cons_a: string;
  pros_b: string;
  cons_b: string;
  pricing_a_plan: string;
  pricing_a_price: string;
  pricing_a_details: string;
  pricing_b_plan: string;
  pricing_b_price: string;
  pricing_b_details: string;
  use_cases_a: string;
  use_cases_b: string;
  is_published: boolean;
}

const emptyForm: ComparisonForm = {
  id: null,
  title: '',
  slug: '',
  summary: '',
  tool_a: '',
  tool_b: '',
  tool_a_slug: '',
  tool_b_slug: '',
  category: 'Comparison',
  winner: 'tie',
  tags: '',
  recommendation: '',
  features: [{ feature: '', tool_a_value: '', tool_b_value: '' }],
  pros_a: '',
  cons_a: '',
  pros_b: '',
  cons_b: '',
  pricing_a_plan: '',
  pricing_a_price: '',
  pricing_a_details: '',
  pricing_b_plan: '',
  pricing_b_price: '',
  pricing_b_details: '',
  use_cases_a: '',
  use_cases_b: '',
  is_published: true,
};

export default function AdminComparePage() {
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ComparisonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    const { data } = await supabase
      .from('tool_comparisons')
      .select('id, title, slug, tool_a, tool_b, winner, category, view_count, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setComparisons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  const startEdit = (c: any) => {
    const features: FeatureRow[] = Array.isArray(c.features) ? c.features : [];
    const prosCons = c.pros_cons || {};
    const pricing = c.pricing || {};
    const useCases = c.use_cases || {};

    setForm({
      id: c.id,
      title: c.title || '',
      slug: c.slug || '',
      summary: c.summary || '',
      tool_a: c.tool_a || '',
      tool_b: c.tool_b || '',
      tool_a_slug: c.tool_a_slug || '',
      tool_b_slug: c.tool_b_slug || '',
      category: c.category || 'Comparison',
      winner: (c.winner as 'tool_a' | 'tool_b' | 'tie') || 'tie',
      tags: Array.isArray(c.tags) ? c.tags.join(', ') : '',
      recommendation: c.recommendation || '',
      features: features.length > 0 ? features : [{ feature: '', tool_a_value: '', tool_b_value: '' }],
      pros_a: prosCons.tool_a?.pros?.join('\n') || '',
      cons_a: prosCons.tool_a?.cons?.join('\n') || '',
      pros_b: prosCons.tool_b?.pros?.join('\n') || '',
      cons_b: prosCons.tool_b?.cons?.join('\n') || '',
      pricing_a_plan: pricing.tool_a?.plan || '',
      pricing_a_price: pricing.tool_a?.price || '',
      pricing_a_details: pricing.tool_a?.details || '',
      pricing_b_plan: pricing.tool_b?.plan || '',
      pricing_b_price: pricing.tool_b?.price || '',
      pricing_b_details: pricing.tool_b?.details || '',
      use_cases_a: Array.isArray(useCases.tool_a) ? useCases.tool_a.join('\n') : '',
      use_cases_b: Array.isArray(useCases.tool_b) ? useCases.tool_b.join('\n') : '',
      is_published: !!c.published_at,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNew = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const addFeatureRow = () => {
    setForm(p => ({ ...p, features: [...p.features, { feature: '', tool_a_value: '', tool_b_value: '' }] }));
  };

  const removeFeatureRow = (index: number) => {
    setForm(p => ({ ...p, features: p.features.filter((_, i) => i !== index) }));
  };

  const moveFeature = (index: number, dir: 'up' | 'down') => {
    setForm(p => {
      const arr = [...p.features];
      const swap = dir === 'up' ? index - 1 : index + 1;
      if (swap < 0 || swap >= arr.length) return p;
      [arr[index], arr[swap]] = [arr[swap], arr[index]];
      return { ...p, features: arr };
    });
  };

  const updateFeature = (index: number, field: keyof FeatureRow, value: string) => {
    setForm(p => ({
      ...p,
      features: p.features.map((f, i) => i === index ? { ...f, [field]: value } : f),
    }));
  };

  const save = async () => {
    if (!form.title || !form.tool_a || !form.tool_b) {
      setError('Title, Tool A, and Tool B are required.');
      return;
    }
    setSaving(true);
    setError('');

    const linesToArray = (s: string) =>
      s.split('\n').map(x => x.trim()).filter(Boolean);

    const featuresClean = form.features.filter(f => f.feature.trim());
    const tagsArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    const slug = form.slug || slugify(form.title);

    const payload = {
      title: form.title,
      slug,
      summary: form.summary,
      tool_a: form.tool_a,
      tool_b: form.tool_b,
      tool_a_slug: form.tool_a_slug || slugify(form.tool_a),
      tool_b_slug: form.tool_b_slug || slugify(form.tool_b),
      features: featuresClean,
      pros_cons: {
        tool_a: { pros: linesToArray(form.pros_a), cons: linesToArray(form.cons_a) },
        tool_b: { pros: linesToArray(form.pros_b), cons: linesToArray(form.cons_b) },
      },
      pricing: {
        tool_a: { plan: form.pricing_a_plan, price: form.pricing_a_price, details: form.pricing_a_details },
        tool_b: { plan: form.pricing_b_plan, price: form.pricing_b_price, details: form.pricing_b_details },
      },
      use_cases: {
        tool_a: linesToArray(form.use_cases_a),
        tool_b: linesToArray(form.use_cases_b),
      },
      recommendation: form.recommendation,
      winner: form.winner,
      category: form.category,
      tags: tagsArr,
      published_at: form.is_published ? new Date().toISOString() : null,
    };

    let dbError;
    if (form.id) {
      ({ error: dbError } = await supabase.from('tool_comparisons').update(payload).eq('id', form.id));
    } else {
      ({ error: dbError } = await supabase.from('tool_comparisons').insert(payload));
    }

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this comparison?')) return;
    await supabase.from('tool_comparisons').delete().eq('id', id);
    setComparisons(prev => prev.filter(c => c.id !== id));
  };

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';
  const labelClass = 'text-xs text-gray-500 mb-1 block';
  const sectionClass = 'glass rounded-xl p-5 space-y-4';
  const sectionTitleClass = 'font-display font-bold text-sm text-white flex items-center gap-2';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Tool Comparisons</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create head-to-head AI tool comparisons</p>
        </div>
        <button onClick={startNew} className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Add Comparison
        </button>
      </div>

      {showForm && (
        <div className="space-y-5 mb-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Basics */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}><Scale className="w-4 h-4 text-brand-blue" /> Basics</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="ChatGPT vs Claude: Which AI Assistant Wins?" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Slug (auto if blank)</label>
                <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Summary</label>
                <textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={2} placeholder="A brief one-line description shown on the comparison card" className={`${inputClass} resize-none`} />
              </div>
            </div>
          </div>

          {/* Tools */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Tools Being Compared</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue">
                  <span className="w-6 h-6 rounded-lg bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">A</span>
                  Tool A
                </div>
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" value={form.tool_a} onChange={e => setForm(p => ({ ...p, tool_a: e.target.value }))} placeholder="ChatGPT" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Slug (links to tool page, auto if blank)</label>
                  <input type="text" value={form.tool_a_slug} onChange={e => setForm(p => ({ ...p, tool_a_slug: e.target.value }))} placeholder="chatgpt" className={inputClass} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-blue">
                  <span className="w-6 h-6 rounded-lg bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">B</span>
                  Tool B
                </div>
                <div>
                  <label className={labelClass}>Name *</label>
                  <input type="text" value={form.tool_b} onChange={e => setForm(p => ({ ...p, tool_b: e.target.value }))} placeholder="Claude" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Slug (links to tool page, auto if blank)</label>
                  <input type="text" value={form.tool_b_slug} onChange={e => setForm(p => ({ ...p, tool_b_slug: e.target.value }))} placeholder="claude" className={inputClass} />
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className={labelClass}>Winner</label>
                <select value={form.winner} onChange={e => setForm(p => ({ ...p, winner: e.target.value as any }))} className={inputClass}>
                  <option value="tie">Tie</option>
                  <option value="tool_a">{form.tool_a || 'Tool A'}</option>
                  <option value="tool_b">{form.tool_b || 'Tool B'}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="llm, chatbot, coding" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Feature Table */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h3 className={sectionTitleClass}>Feature Comparison Table</h3>
              <button onClick={addFeatureRow} className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-gray-500 px-2">
                <span>Feature</span>
                <span>{form.tool_a || 'Tool A'}</span>
                <span>{form.tool_b || 'Tool B'}</span>
                <span />
              </div>
              {form.features.map((f, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                  <input type="text" value={f.feature} onChange={e => updateFeature(i, 'feature', e.target.value)} placeholder="Context window" className={`${inputClass} py-2`} />
                  <input type="text" value={f.tool_a_value} onChange={e => updateFeature(i, 'tool_a_value', e.target.value)} placeholder="128K" className={`${inputClass} py-2`} />
                  <input type="text" value={f.tool_b_value} onChange={e => updateFeature(i, 'tool_b_value', e.target.value)} placeholder="200K" className={`${inputClass} py-2`} />
                  <div className="flex items-center gap-0.5 pt-1">
                    <button onClick={() => moveFeature(i, 'up')} disabled={i === 0} className="p-1.5 text-gray-600 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/8">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveFeature(i, 'down')} disabled={i === form.features.length - 1} className="p-1.5 text-gray-600 hover:text-white disabled:opacity-30 rounded-lg hover:bg-white/8">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeFeatureRow(i)} className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {form.features.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-3">No feature rows yet. Click "Add Row" to start.</p>
              )}
            </div>
          </div>

          {/* Pros & Cons */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Pros &amp; Cons</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-white bg-brand-700/60 rounded-lg px-3 py-2 border border-white/8">{form.tool_a || 'Tool A'}</div>
                <div>
                  <label className={labelClass}>Pros (one per line)</label>
                  <textarea value={form.pros_a} onChange={e => setForm(p => ({ ...p, pros_a: e.target.value }))} rows={4} placeholder="Fast responses&#10;Large context" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Cons (one per line)</label>
                  <textarea value={form.cons_a} onChange={e => setForm(p => ({ ...p, cons_a: e.target.value }))} rows={4} placeholder="Expensive at scale&#10;Occasional hallucinations" className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-white bg-brand-700/60 rounded-lg px-3 py-2 border border-white/8">{form.tool_b || 'Tool B'}</div>
                <div>
                  <label className={labelClass}>Pros (one per line)</label>
                  <textarea value={form.pros_b} onChange={e => setForm(p => ({ ...p, pros_b: e.target.value }))} rows={4} placeholder="Better reasoning&#10;More affordable" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Cons (one per line)</label>
                  <textarea value={form.cons_b} onChange={e => setForm(p => ({ ...p, cons_b: e.target.value }))} rows={4} placeholder="Slower responses&#10;Smaller ecosystem" className={`${inputClass} resize-none`} />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-white bg-brand-700/60 rounded-lg px-3 py-2 border border-white/8">{form.tool_a || 'Tool A'}</div>
                <div><label className={labelClass}>Plan Name</label><input type="text" value={form.pricing_a_plan} onChange={e => setForm(p => ({ ...p, pricing_a_plan: e.target.value }))} placeholder="Plus" className={inputClass} /></div>
                <div><label className={labelClass}>Price</label><input type="text" value={form.pricing_a_price} onChange={e => setForm(p => ({ ...p, pricing_a_price: e.target.value }))} placeholder="$20/mo" className={inputClass} /></div>
                <div><label className={labelClass}>Details</label><textarea value={form.pricing_a_details} onChange={e => setForm(p => ({ ...p, pricing_a_details: e.target.value }))} rows={2} placeholder="Access to GPT-4o, DALL-E, etc." className={`${inputClass} resize-none`} /></div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-semibold text-white bg-brand-700/60 rounded-lg px-3 py-2 border border-white/8">{form.tool_b || 'Tool B'}</div>
                <div><label className={labelClass}>Plan Name</label><input type="text" value={form.pricing_b_plan} onChange={e => setForm(p => ({ ...p, pricing_b_plan: e.target.value }))} placeholder="Pro" className={inputClass} /></div>
                <div><label className={labelClass}>Price</label><input type="text" value={form.pricing_b_price} onChange={e => setForm(p => ({ ...p, pricing_b_price: e.target.value }))} placeholder="$20/mo" className={inputClass} /></div>
                <div><label className={labelClass}>Details</label><textarea value={form.pricing_b_details} onChange={e => setForm(p => ({ ...p, pricing_b_details: e.target.value }))} rows={2} placeholder="Access to Claude 3.5 Sonnet, etc." className={`${inputClass} resize-none`} /></div>
              </div>
            </div>
          </div>

          {/* Use Cases & Recommendation */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>Use Cases &amp; Recommendation</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Best for {form.tool_a || 'Tool A'} (one per line)</label>
                <textarea value={form.use_cases_a} onChange={e => setForm(p => ({ ...p, use_cases_a: e.target.value }))} rows={3} placeholder="General chat&#10;Creative writing" className={`${inputClass} resize-none`} />
              </div>
              <div>
                <label className={labelClass}>Best for {form.tool_b || 'Tool B'} (one per line)</label>
                <textarea value={form.use_cases_b} onChange={e => setForm(p => ({ ...p, use_cases_b: e.target.value }))} rows={3} placeholder="Code generation&#10;Long document analysis" className={`${inputClass} resize-none`} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Overall Recommendation</label>
                <textarea value={form.recommendation} onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))} rows={3} placeholder="Choose Tool A if you need... Choose Tool B if you value..." className={`${inputClass} resize-none`} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => setForm(p => ({ ...p, is_published: !p.is_published }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.is_published ? 'bg-brand-blue' : 'bg-brand-700'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm text-gray-400 flex items-center gap-1.5">
                    {form.is_published ? <><Eye className="w-3.5 h-3.5" /> Published</> : <><EyeOff className="w-3.5 h-3.5" /> Draft (hidden)</>}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Save buttons */}
          <div className="flex gap-2 sticky bottom-4 z-10">
            <button onClick={save} disabled={saving} className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50 shadow-lg">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : form.id ? 'Update Comparison' : 'Create Comparison'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }} className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm bg-brand-900">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-white/8">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Comparison</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Winner</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Views</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Status</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : comparisons.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-500">
                <Scale className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                No comparisons yet. Click "Add Comparison" to create one.
              </td></tr>
            ) : comparisons.map(c => (
              <tr key={c.id} className="hover:bg-white/2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0">
                      <Scale className="w-4 h-4 text-brand-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-gray-600 truncate">{c.tool_a} vs {c.tool_b}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">
                  {c.winner === 'tool_a' ? c.tool_a : c.winner === 'tool_b' ? c.tool_b : 'Tie'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">{c.view_count || 0}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.published_at ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">Published</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/15 text-gray-500 border border-gray-600/25">Draft</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/compare/${c.slug}`} target="_blank" className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10" title="View">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => startEdit(c)} className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10" title="Edit">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10" title="Delete">
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
