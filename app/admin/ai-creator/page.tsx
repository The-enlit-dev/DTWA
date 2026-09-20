'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Sparkles, Plus, Trash2, Edit, CheckCircle, XCircle, Send, Loader2, Cpu,
  GitCompare, BookOpen, FileText, Video, Mail, AlertCircle, Save,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

type GenType = 'tool_analysis' | 'comparison' | 'case_study' | 'blog_simplifier' | 'video_script' | 'newsletter';
type Status = 'draft' | 'review' | 'approved' | 'rejected' | 'published';

const TABS: { key: GenType; label: string; icon: any; fields: { key: string; label: string; placeholder?: string; textarea?: boolean }[] }[] = [
  {
    key: 'tool_analysis',
    label: 'Tool Analysis',
    icon: Cpu,
    fields: [
      { key: 'tool_name', label: 'Tool Name *', placeholder: 'ChatGPT' },
      { key: 'website', label: 'Website', placeholder: 'https://chat.openai.com' },
      { key: 'category', label: 'Category', placeholder: 'LLM / Chatbot' },
      { key: 'focus', label: 'Focus Areas', placeholder: 'Pricing, features, use cases', textarea: true },
    ],
  },
  {
    key: 'comparison',
    label: 'Comparison Generator',
    icon: GitCompare,
    fields: [
      { key: 'tool_a', label: 'Tool A *', placeholder: 'ChatGPT' },
      { key: 'tool_b', label: 'Tool B *', placeholder: 'Claude' },
      { key: 'criteria', label: 'Comparison Criteria', placeholder: 'Pricing, accuracy, speed, features', textarea: true },
    ],
  },
  {
    key: 'case_study',
    label: 'Case Study Generator',
    icon: BookOpen,
    fields: [
      { key: 'company', label: 'Company / Organization *', placeholder: 'Acme Corp' },
      { key: 'tool_used', label: 'Tool Used *', placeholder: 'Midjourney' },
      { key: 'use_case', label: 'Use Case', placeholder: 'Marketing campaign visuals', textarea: true },
      { key: 'results', label: 'Known Results / Outcomes', placeholder: 'Increased engagement by 40%', textarea: true },
    ],
  },
  {
    key: 'blog_simplifier',
    label: 'Blog Simplifier',
    icon: FileText,
    fields: [
      { key: 'source_url', label: 'Source URL', placeholder: 'https://example.com/complex-article' },
      { key: 'source_text', label: 'Paste Article Text', placeholder: 'Paste the full article text here...', textarea: true },
      { key: 'target_audience', label: 'Target Audience', placeholder: 'Beginners / General audience' },
    ],
  },
  {
    key: 'video_script',
    label: 'Video Scripts',
    icon: Video,
    fields: [
      { key: 'topic', label: 'Video Topic *', placeholder: 'How to use ChatGPT for productivity' },
      { key: 'duration', label: 'Target Duration', placeholder: '5-10 minutes' },
      { key: 'platform', label: 'Platform', placeholder: 'YouTube / TikTok / Reels' },
      { key: 'tone', label: 'Tone', placeholder: 'Informative / Casual / Energetic' },
    ],
  },
  {
    key: 'newsletter',
    label: 'Newsletter Generator',
    icon: Mail,
    fields: [
      { key: 'subject', label: 'Newsletter Subject *', placeholder: 'This week in AI' },
      { key: 'topics', label: 'Topics to Cover', placeholder: 'New tool launches, research papers, industry news', textarea: true },
      { key: 'audience', label: 'Audience', placeholder: 'AI enthusiasts / Developers' },
    ],
  },
];

const STATUS_STYLES: Record<Status, string> = {
  draft: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  review: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  approved: 'bg-green-500/15 text-green-400 border border-green-500/20',
  rejected: 'bg-red-500/15 text-red-400 border border-red-500/20',
  published: 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25',
};

export default function AdminAICreatorPage() {
  const [tab, setTab] = useState<GenType>('tool_analysis');
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const currentTab = TABS.find((t) => t.key === tab)!;

  const fetchData = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('ai_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) setError(err.message);
    setGenerations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generate = async () => {
    const requiredField = currentTab.fields.find((f) => f.label.includes('*'));
    if (requiredField && !formValues[requiredField.key]?.trim()) {
      setError(`Please fill in: ${requiredField.label.replace(' *', '')}`);
      return;
    }
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const title =
      formValues[currentTab.fields[0]?.key] ||
      `${currentTab.label} ${new Date().toLocaleDateString()}`;
    const payload: any = {
      generation_type: tab,
      title: title.slice(0, 200),
      input_data: formValues,
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    if (user) payload.created_by = user.id;

    // Call AI edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      try {
        const aiRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ feature: tab, input: formValues }),
        });
        const aiData = await aiRes.json();
        if (aiRes.ok && aiData.content) {
          payload.output_data = aiData.content;
          payload.status = 'review';
        } else if (aiData.error) {
          // Save as draft with error note
          payload.output_data = { error: aiData.error };
        }
      } catch {
        // If edge function fails, save as draft
      }
    }

    const { error: err } = await supabase.from('ai_generations').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setFormValues({});
    fetchData();
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error: err } = await supabase
      .from('ai_generations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) { setError(err.message); return; }
    setGenerations((prev) => prev.map((g) => (g.id === id ? { ...g, status } : g)));
  };

  const saveEdit = async (id: string) => {
    const { error: err } = await supabase
      .from('ai_generations')
      .update({ title: editTitle, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) { setError(err.message); return; }
    setGenerations((prev) => prev.map((g) => (g.id === id ? { ...g, title: editTitle } : g)));
    setEditingId(null);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this generation? This cannot be undone.')) return;
    const { error: err } = await supabase.from('ai_generations').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  };

  const filtered = filterStatus === 'all'
    ? generations
    : generations.filter((g) => g.status === filterStatus);

  const tabGenerations = filtered.filter((g) => g.generation_type === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-blue" /> AI Creator Studio
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate and manage AI-assisted content</p>
        </div>
      </div>

      {/* API key notice */}
      <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300 font-medium">AI generation requires an API key to be configured.</p>
            <p className="text-xs text-yellow-400/70 mt-1">
              Until an AI API key (e.g. OpenAI, Anthropic) is set in Edge Function secrets, the
              &ldquo;Generate&rdquo; button saves your input as a <strong>draft</strong>. Once
              configured, generation will call the Supabase Edge Function to produce content automatically.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = generations.filter((g) => g.generation_type === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25'
                  : 'text-gray-400 hover:text-white border border-white/8'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {count > 0 && <span className="text-xs opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Input form */}
      <div className="glass rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <currentTab.icon className="w-4 h-4 text-brand-blue" />
          {currentTab.label}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {currentTab.fields.map((f) => (
            <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
              <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={formValues[f.key] || ''}
                  onChange={(e) => setFormValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              ) : (
                <input
                  type="text"
                  value={formValues[f.key] || ''}
                  onChange={(e) => setFormValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generate}
            disabled={saving}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {saving ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={() => { setFormValues({}); setError(''); }}
            className="px-5 py-2.5 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm">Generated Content — {currentTab.label}</h3>
          <div className="flex gap-1.5">
            {(['all', 'draft', 'review', 'approved', 'rejected', 'published'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filterStatus === s ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500 glass rounded-xl">Loading...</div>
        ) : tabGenerations.length === 0 ? (
          <div className="text-center py-10 glass rounded-xl">
            <Sparkles className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No {currentTab.label.toLowerCase()} generations yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabGenerations.map((g) => {
              const input = g.input_data || {};
              return (
                <div key={g.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      {editingId === g.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className={`${inputClass} flex-1`}
                          />
                          <button onClick={() => saveEdit(g.id)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-white/8 rounded-lg">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white truncate">{g.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDistanceToNow(new Date(g.created_at), { addSuffix: true })}
                          </p>
                        </>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[g.status as Status]}`}>
                      {g.status}
                    </span>
                  </div>

                  {/* Input summary */}
                  <div className="bg-brand-900/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Input</p>
                    <div className="space-y-1">
                      {Object.entries(input).filter(([, v]) => v).slice(0, 4).map(([k, v]) => (
                        <p key={k} className="text-xs text-gray-400">
                          <span className="text-gray-600">{k.replace(/_/g, ' ')}:</span>{' '}
                          <span className="text-gray-300">{String(v).slice(0, 100)}{String(v).length > 100 ? '...' : ''}</span>
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* AI Output */}
                  {g.output_data && Object.keys(g.output_data).length > 0 && (
                    <div className="bg-brand-900/50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-brand-blue" /> AI Output
                      </p>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
                        {typeof g.output_data === 'string' ? g.output_data : JSON.stringify(g.output_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => { setEditingId(g.id); setEditTitle(g.title); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/10"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => updateStatus(g.id, 'review')}
                      disabled={g.status === 'review'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" /> Review
                    </button>
                    <button
                      onClick={() => updateStatus(g.id, 'approved')}
                      disabled={g.status === 'approved'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded-lg text-xs hover:bg-green-500/20 disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(g.id, 'rejected')}
                      disabled={g.status === 'rejected'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => updateStatus(g.id, 'published')}
                      disabled={g.status === 'published'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 text-brand-blue rounded-lg text-xs hover:bg-brand-blue/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" /> Publish
                    </button>
                    <button
                      onClick={() => del(g.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
