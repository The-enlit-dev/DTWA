'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Mail, Users, Send, Eye, Edit3, CheckCircle2, Clock, AlertCircle,
  CalendarClock, Save, Trash2, BarChart2, Bold, Italic, Heading2,
  List, Link2, Quote, Minus, Loader2, RefreshCw, Lock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function callEdgeFunction(slug: string, payload: Record<string, any>, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ─── Rich Text Toolbar ──────────────────────────────────────────────────────

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: (ta: HTMLTextAreaElement) => void;
}

function wrapSelection(ta: HTMLTextAreaElement, open: string, close: string) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.slice(start, end);
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(end);
  const newVal = `${before}${open}${selected || 'text'}${close}${after}`;
  const newCursor = selected ? start + open.length + selected.length + close.length : start + open.length;
  ta.value = newVal;
  ta.setSelectionRange(selected ? newCursor : start + open.length, newCursor);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
}

function insertAtCursor(ta: HTMLTextAreaElement, text: string) {
  const start = ta.selectionStart;
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(start);
  ta.value = `${before}${text}${after}`;
  ta.setSelectionRange(start + text.length, start + text.length);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
}

function prependLine(ta: HTMLTextAreaElement, prefix: string) {
  const start = ta.selectionStart;
  const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = ta.value.indexOf('\n', start);
  const end = lineEnd === -1 ? ta.value.length : lineEnd;
  const line = ta.value.slice(lineStart, end);
  const before = ta.value.slice(0, lineStart);
  const after = ta.value.slice(end);
  ta.value = `${before}${prefix}${line}${after}`;
  ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length + line.length);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.focus();
}

// ─── Email section templates ─────────────────────────────────────────────────

const SECTION_TEMPLATES = [
  {
    label: 'Opening Hook',
    html: `<h2>This Week in AI</h2>\n<p>Write your opening paragraph here. Grab attention, set the stage for the week ahead.</p>\n`,
  },
  {
    label: 'Tool Spotlight',
    html: `<h3>🔧 Tool of the Week: [Tool Name]</h3>\n<p><strong>[One sentence pitch]</strong></p>\n<p>What it does, why it matters, and who should use it.</p>\n<ul>\n  <li>Key feature 1</li>\n  <li>Key feature 2</li>\n  <li>Pricing: Free / $X per month</li>\n</ul>\n`,
  },
  {
    label: 'Company Take',
    html: `<h3>📈 Company Spotlight: [Company]</h3>\n<p>What's happening with [Company] this week, and why you should care.</p>\n`,
  },
  {
    label: 'Trend Watch',
    html: `<h3>📡 Trend to Watch</h3>\n<p>One important AI trend you need to understand right now.</p>\n`,
  },
  {
    label: 'Closing Note',
    html: `<h3>Until Next Week</h3>\n<p>Closing thoughts from Attharva. Personal, direct, worth reading.</p>\n<p>— Attharva</p>\n`,
  },
  {
    label: 'Divider',
    html: `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">\n`,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'compose' | 'subscribers' | 'history'>('compose');

  // Permission state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Compose state
  const [editingId, setEditingId] = useState<string | null>(null); // null = new
  const [subject, setSubject] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendMode, setSendMode] = useState<'draft' | 'schedule' | 'now'>('draft');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Permission check ──────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasPermission(false); return; }
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
      if (isAdmin) { setHasPermission(true); return; }

      const { data: perm } = await supabase
        .from('editor_permissions')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', 'newsletter')
        .maybeSingle();

      setHasPermission(!!perm);
    })();
  }, []);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const [{ data: subs }, { data: nl }] = await Promise.all([
      supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false })
        .limit(1000),
      supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setSubscribers(subs || []);
    setNewsletters(nl || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Compose handlers ──────────────────────────────────────────────────────

  const clearCompose = () => {
    setEditingId(null);
    setSubject('');
    setContentHtml('');
    setScheduledAt('');
    setSendMode('draft');
    setPreview(false);
    setMsg(null);
  };

  const loadDraft = (nl: any) => {
    setEditingId(nl.id);
    setSubject(nl.subject);
    setContentHtml(nl.content_html);
    setScheduledAt(nl.scheduled_at ? format(new Date(nl.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '');
    setSendMode(nl.scheduled_at ? 'schedule' : 'draft');
    setTab('compose');
    setMsg({ type: 'success', text: `Loaded draft: "${nl.subject}"` });
  };

  const handleSave = async () => {
    if (!subject.trim() || !contentHtml.trim()) {
      setMsg({ type: 'error', text: 'Subject and content are required.' });
      return;
    }
    setSaving(true);
    setMsg(null);

    // ── Send Now ─────────────────────────────────────────────────────────────
    if (sendMode === 'now') {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSaving(false); return; }

      const confirmed = subscribers.filter((s) => s.is_confirmed).length;
      if (!confirm(`Send immediately to ${confirmed} confirmed subscribers?\n\nThis cannot be undone.`)) {
        setSaving(false);
        return;
      }

      try {
        const result = await callEdgeFunction(
          'send-scheduled-newsletters',
          { send_now: true, subject, content_html: contentHtml },
          session.access_token,
        );
        setMsg({ type: 'success', text: `Sent to ${result.sent} subscribers!` });
        clearCompose();
        loadData();
      } catch (e: any) {
        setMsg({ type: 'error', text: e.message });
      }
      setSaving(false);
      return;
    }

    // ── Save Draft / Schedule ─────────────────────────────────────────────────
    const payload: Record<string, any> = {
      subject,
      content_html: contentHtml,
      status: 'draft',
      updated_at: new Date().toISOString(),
      scheduled_at: sendMode === 'schedule' && scheduledAt
        ? new Date(scheduledAt).toISOString()
        : null,
    };

    let err;
    if (editingId) {
      ({ error: err } = await supabase.from('newsletters').update(payload).eq('id', editingId));
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('newsletters')
        .insert(payload)
        .select()
        .single();
      err = insertErr;
      if (inserted) setEditingId(inserted.id);
    }

    setSaving(false);
    if (err) {
      setMsg({ type: 'error', text: err.message });
    } else if (sendMode === 'schedule' && scheduledAt) {
      setMsg({ type: 'success', text: `Scheduled for ${format(new Date(scheduledAt), 'MMM d, yyyy h:mm a')}` });
      loadData();
    } else {
      setMsg({ type: 'success', text: 'Draft saved.' });
      loadData();
    }
  };

  const deleteDraft = async (id: string) => {
    if (!confirm('Delete this draft?')) return;
    await supabase.from('newsletters').delete().eq('id', id).eq('status', 'draft');
    loadData();
    if (editingId === id) clearCompose();
  };

  // ── Toolbar helpers ───────────────────────────────────────────────────────

  const toolbar = (action: (ta: HTMLTextAreaElement) => void) => {
    if (textareaRef.current) {
      action(textareaRef.current);
      setContentHtml(textareaRef.current.value);
    }
  };

  const confirmedCount = subscribers.filter((s) => s.is_confirmed).length;
  const thisMonth = subscribers.filter((s) =>
    Date.now() - new Date(s.subscribed_at).getTime() < 30 * 24 * 60 * 60 * 1000
  ).length;

  const drafts = newsletters.filter((n) => n.status === 'draft');
  const sent = newsletters.filter((n) => n.status === 'sent');

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  // ── Permission gate ───────────────────────────────────────────────────────

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <Lock className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Access</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          You don&apos;t have newsletter permissions. Ask an admin to grant you access on the Team page.
        </p>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Newsletter</h1>
          <p className="text-gray-500 text-sm">{confirmedCount} confirmed subscribers</p>
        </div>
        <button
          onClick={() => { loadData(); setMsg(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white border border-white/8 rounded-lg text-xs hover:border-white/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">{loading ? '—' : subscribers.length}</div>
            <div className="text-xs text-gray-500">Total Subscribers</div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">{loading ? '—' : confirmedCount}</div>
            <div className="text-xs text-gray-500">Confirmed</div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">{loading ? '—' : sent.length}</div>
            <div className="text-xs text-gray-500">Issues Sent</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['compose', 'subscribers', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize flex items-center gap-1.5 ${
              tab === t ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {t === 'compose' && <Edit3 className="w-3.5 h-3.5" />}
            {t === 'subscribers' && <Users className="w-3.5 h-3.5" />}
            {t === 'history' && <BarChart2 className="w-3.5 h-3.5" />}
            {t === 'compose' && editingId ? 'Editing Draft' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'compose' && drafts.length > 0 && !editingId && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 rounded-full">{drafts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── COMPOSE ─────────────────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div className="space-y-5">
          {msg && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              msg.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-300'
            }`}>
              {msg.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {msg.text}
              {msg.type === 'success' && (
                <button onClick={() => setMsg(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">Dismiss</button>
              )}
            </div>
          )}

          {/* Drafts quick-load */}
          {drafts.length > 0 && !editingId && (
            <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Saved Drafts — click to continue editing
              </p>
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 bg-brand-800/60 rounded-lg px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{d.subject || '(No subject)'}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => loadDraft(d)} className="text-xs px-3 py-1.5 bg-brand-blue/15 text-brand-blue rounded-lg hover:bg-brand-blue/25 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => deleteDraft(d.id)} className="text-xs px-2 py-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">Subject Line *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Decoding Tomorrow — Week of June 27, 2026"
              className={inputClass}
            />
          </div>

          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <label className="text-xs text-gray-500 font-medium">Newsletter Content (HTML) *</label>
              {contentHtml && (
                <button
                  onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1.5 text-xs text-brand-blue hover:text-blue-300 transition-colors"
                >
                  {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {preview ? 'Back to editor' : 'Preview email'}
                </button>
              )}
            </div>

            {preview ? (
              /* ── Email preview ── */
              <div className="rounded-xl overflow-hidden border border-white/8">
                <div className="bg-gray-100 p-2 flex items-center justify-center border-b border-gray-200">
                  <span className="text-xs text-gray-500 font-medium">Email Preview</span>
                </div>
                <div className="bg-[#f0f2f5] p-4">
                  <div className="max-w-[600px] mx-auto bg-white rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#0f3460] p-8 text-center">
                      <h1 className="text-white text-xl font-bold m-0">Decoding Tomorrow</h1>
                      <p className="text-[#94a3b8] text-xs mt-1 m-0">with Attharva — Your Weekly AI Intelligence Brief</p>
                    </div>
                    <div
                      className="p-8 text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                    />
                    <div className="bg-[#f8fafc] px-8 py-5 text-center border-t border-gray-100">
                      <p className="text-xs text-gray-400 m-0">You're receiving this because you subscribed at decodingtomorrowwithattharva.netlify.app</p>
                      <p className="text-xs text-gray-400 m-0 mt-1">Reply "unsubscribe" to opt out at any time.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Editor ── */
              <div className="rounded-xl overflow-hidden border border-white/10">
                {/* Toolbar */}
                <div className="flex items-center gap-1 px-3 py-2 bg-brand-800/80 border-b border-white/8 flex-wrap">
                  <button title="Bold" onClick={() => toolbar((ta) => wrapSelection(ta, '<strong>', '</strong>'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button title="Italic" onClick={() => toolbar((ta) => wrapSelection(ta, '<em>', '</em>'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button title="Heading 2" onClick={() => toolbar((ta) => prependLine(ta, '<h2>'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors text-xs font-bold">H2</button>
                  <button title="Heading 3" onClick={() => toolbar((ta) => prependLine(ta, '<h3>'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors text-xs font-bold">H3</button>
                  <button title="Paragraph" onClick={() => toolbar((ta) => wrapSelection(ta, '<p>', '</p>\n'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors text-xs font-bold">P</button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button title="Bullet List" onClick={() => toolbar((ta) => wrapSelection(ta, '<ul>\n  <li>', '</li>\n</ul>\n'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button title="Link" onClick={() => toolbar((ta) => wrapSelection(ta, '<a href="https://">', '</a>'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button title="Blockquote" onClick={() => toolbar((ta) => wrapSelection(ta, '<blockquote>', '</blockquote>\n'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button title="Divider" onClick={() => toolbar((ta) => insertAtCursor(ta, '\n<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">\n'))} className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  {/* Section templates */}
                  <div className="relative group">
                    <button className="px-2 py-1 text-xs text-gray-400 hover:text-white rounded hover:bg-white/8 transition-colors flex items-center gap-1">
                      + Section
                    </button>
                    <div className="absolute left-0 top-full mt-1 w-44 glass border border-white/10 rounded-xl shadow-xl py-1 z-20 hidden group-hover:block">
                      {SECTION_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.label}
                          onClick={() => toolbar((ta) => insertAtCursor(ta, '\n' + tmpl.html))}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder={`Start writing your newsletter HTML here...\n\nOr click "+ Section" above to insert a template block.`}
                  rows={22}
                  className="w-full bg-brand-800/60 px-4 py-4 text-white placeholder-gray-600 text-xs font-mono resize-y focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Delivery options */}
          <div className="glass rounded-xl p-5 border border-white/8">
            <h3 className="font-semibold text-white text-sm mb-4">Delivery</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => setSendMode('draft')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
                  sendMode === 'draft'
                    ? 'border-gray-400 bg-gray-400/10 text-white'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={() => setSendMode('schedule')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
                  sendMode === 'schedule'
                    ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <CalendarClock className="w-4 h-4" />
                Schedule
              </button>
              <button
                onClick={() => setSendMode('now')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
                  sendMode === 'now'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Send className="w-4 h-4" />
                Send Now
              </button>
            </div>

            {sendMode === 'schedule' && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Send Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            {sendMode === 'now' && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  This will send to <strong>{confirmedCount} confirmed subscriber{confirmedCount !== 1 ? 's' : ''}</strong> immediately.
                  Make sure RESEND_API_KEY is configured in Supabase Edge Function Secrets.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSave}
              disabled={saving || !subject || !contentHtml}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-white ${
                sendMode === 'now'
                  ? 'bg-green-600 hover:bg-green-500'
                  : sendMode === 'schedule'
                  ? 'btn-gradient'
                  : 'bg-brand-800 border border-white/15 hover:bg-white/8'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sendMode === 'now' ? (
                <Send className="w-4 h-4" />
              ) : sendMode === 'schedule' ? (
                <CalendarClock className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? 'Saving...'
                : sendMode === 'now'
                ? `Send to ${confirmedCount} Subscribers`
                : sendMode === 'schedule'
                ? 'Schedule Newsletter'
                : editingId
                ? 'Update Draft'
                : 'Save Draft'}
            </button>

            {editingId && (
              <button
                onClick={clearCompose}
                className="px-4 py-3 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
              >
                New Newsletter
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SUBSCRIBERS ──────────────────────────────────────────────────────── */}
      {tab === 'subscribers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              <span className="text-white font-medium">{confirmedCount}</span> confirmed ·{' '}
              <span className="text-white font-medium">{subscribers.length - confirmedCount}</span> pending ·{' '}
              <span className="text-white font-medium">{thisMonth}</span> this month
            </p>
          </div>
          <div className="glass rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-gray-500">No subscribers yet.</td></tr>
                ) : subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{s.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-400">{s.name || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.is_confirmed
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {s.is_confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(s.subscribed_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── HISTORY / ANALYTICS ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-4">
          {/* Aggregate stats */}
          {sent.length > 0 && (
            <div className="glass rounded-xl p-5 border border-white/8 mb-6">
              <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-brand-blue" /> All-time Delivery Stats
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-display font-bold gradient-text">{sent.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Issues Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold gradient-text">
                    {sent.reduce((s, n) => s + (n.recipient_count || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Total Deliveries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold gradient-text">
                    {sent.length > 0
                      ? Math.round(sent.reduce((s, n) => s + (n.recipient_count || 0), 0) / sent.length)
                      : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Avg. Recipients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-display font-bold gradient-text">{subscriberGrowthRate(subscribers)}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">Monthly Growth</div>
                </div>
              </div>
            </div>
          )}

          {newsletters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No newsletters yet.</div>
          ) : newsletters.map((n) => (
            <div key={n.id} className="glass rounded-xl p-5 border border-white/8 hover:border-white/12 transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.status === 'sent'
                    ? 'bg-green-500/10 border border-green-500/20'
                    : n.scheduled_at
                    ? 'bg-blue-500/10 border border-blue-500/20'
                    : 'bg-white/5 border border-white/8'
                }`}>
                  {n.status === 'sent'
                    ? <Send className="w-4 h-4 text-green-400" />
                    : n.scheduled_at
                    ? <CalendarClock className="w-4 h-4 text-blue-400" />
                    : <Edit3 className="w-4 h-4 text-gray-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">{n.subject || '(No subject)'}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                      n.status === 'sent'
                        ? 'bg-green-500/15 text-green-400'
                        : n.scheduled_at
                        ? 'bg-blue-500/15 text-blue-400'
                        : 'bg-gray-500/15 text-gray-400'
                    }`}>
                      {n.status === 'sent' ? 'Sent' : n.scheduled_at ? 'Scheduled' : 'Draft'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    {n.status === 'sent' && (
                      <>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {(n.recipient_count || 0).toLocaleString()} delivered
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Sent {n.sent_at ? formatDistanceToNow(new Date(n.sent_at), { addSuffix: true }) : ''}
                        </span>
                      </>
                    )}
                    {n.scheduled_at && n.status !== 'sent' && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Scheduled: {format(new Date(n.scheduled_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
                    <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {n.status === 'draft' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { loadDraft(n); setTab('compose'); }}
                      className="text-xs px-3 py-1.5 bg-brand-blue/15 text-brand-blue rounded-lg hover:bg-brand-blue/25 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDraft(n.id)}
                      className="text-xs p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function subscriberGrowthRate(subscribers: any[]): number {
  const now = Date.now();
  const ms30 = 30 * 24 * 60 * 60 * 1000;
  const ms60 = 60 * 24 * 60 * 60 * 1000;
  const last30 = subscribers.filter((s) => now - new Date(s.subscribed_at).getTime() < ms30).length;
  const prev30 = subscribers.filter((s) => {
    const age = now - new Date(s.subscribed_at).getTime();
    return age >= ms30 && age < ms60;
  }).length;
  if (prev30 === 0) return last30 > 0 ? 100 : 0;
  return Math.round(((last30 - prev30) / prev30) * 100);
}
