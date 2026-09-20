'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bell, Send, Loader2, Check, X, Users, Mail, Rocket, Zap,
  Clock, AlertTriangle, MessageSquare, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type NotifType = 'announcement' | 'challenge' | 'update' | 'general';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface Template {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: NotifType;
  title: string;
  body: string;
  accent: string;
}

const TEMPLATES: Template[] = [
  {
    label: 'New Challenge Live',
    icon: Rocket,
    type: 'challenge',
    title: 'New Weekly Challenge is Live!',
    body: "Check out this week's challenge and submit your entry.",
    accent: 'text-brand-orange',
  },
  {
    label: 'Platform Update',
    icon: Zap,
    type: 'update',
    title: 'Platform Update',
    body: "We've shipped new features. Come check them out!",
    accent: 'text-brand-blue',
  },
  {
    label: 'Weekly Newsletter',
    icon: Mail,
    type: 'announcement',
    title: 'This Week in AI',
    body: 'Your weekly digest of AI news and updates.',
    accent: 'text-green-400',
  },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  announcement: { label: 'Announcement', cls: 'bg-brand-orange/15 text-brand-orange' },
  challenge: { label: 'Challenge', cls: 'bg-purple-500/15 text-purple-400' },
  update: { label: 'Update', cls: 'bg-brand-blue/15 text-brand-blue' },
  general: { label: 'General', cls: 'bg-gray-500/15 text-gray-400' },
};

export default function AdminNotificationsPage() {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [notifType, setNotifType] = useState<NotifType>('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Data state ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const [totalSent, setTotalSent] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [sentToday, setSentToday] = useState<number | null>(null);

  const inputClass =
    'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors';

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      { data: recent },
      { count: total },
      { count: unread },
      { count: todayCount },
    ] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('notifications').select('*', { count: 'exact', head: true }),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false),
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),
    ]);

    setNotifications((recent as Notification[]) || []);
    setTotalSent(total ?? 0);
    setUnreadCount(unread ?? 0);
    setSentToday(todayCount ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const applyTemplate = (tmpl: Template) => {
    setNotifType(tmpl.type);
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setLinkUrl('');
    setMsg(null);
  };

  const resetForm = () => {
    setNotifType('announcement');
    setTitle('');
    setBody('');
    setLinkUrl('');
    setMsg(null);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setMsg({ type: 'error', text: 'Title and body are required.' });
      return;
    }
    setSending(true);
    setMsg(null);

    const { data, error } = await supabase.rpc('send_notification_to_all', {
      notif_type: notifType,
      notif_title: title.trim(),
      notif_body: body.trim(),
      notif_link: linkUrl.trim() || null,
    });

    setSending(false);

    if (error) {
      setMsg({ type: 'error', text: error.message });
      return;
    }

    const count = typeof data === 'number' ? data : 0;
    setMsg({
      type: 'success',
      text: `Notification sent to ${count.toLocaleString()} user${count !== 1 ? 's' : ''}.`,
    });
    resetForm();
    loadData();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Notifications</h1>
          <p className="text-gray-500 text-sm">Send platform-wide notifications</p>
        </div>
        <button
          onClick={() => { loadData(); setMsg(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white border border-white/8 rounded-lg text-xs hover:border-white/20 transition-colors"
        >
          <Clock className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">
              {loading ? '—' : (totalSent ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Total Sent</div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">
              {loading ? '—' : (unreadCount ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Unread Platform-wide</div>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div className="text-xl font-display font-bold text-white">
              {loading ? '—' : (sentToday ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Sent Today</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Compose form ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">
                <Send className="w-4 h-4 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-white">Send Platform-Wide Notification</h2>
                <p className="text-xs text-gray-500">Delivers a notification to every user.</p>
              </div>
            </div>

            {msg && (
              <div className={`flex items-start gap-3 p-4 rounded-xl text-sm mb-5 ${
                msg.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {msg.type === 'success'
                  ? <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span className="flex-1">{msg.text}</span>
                <button
                  onClick={() => setMsg(null)}
                  className="ml-auto text-xs opacity-60 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Quick templates */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2 font-medium">Quick Templates</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all text-left"
                >
                  <Icon className={`w-4 h-4 ${tmpl.accent} shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{tmpl.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tmpl.title}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 shrink-0 mt-1 transition-colors" />
                </button>
              );
            })}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['announcement', 'challenge', 'update', 'general'] as NotifType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNotifType(t)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium capitalize transition-all border ${
                        notifType === t
                          ? 'border-brand-blue bg-brand-blue/15 text-brand-blue'
                          : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Notification message..."
                  rows={4}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">Link URL (optional)</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://decodingtomorrowwithattharva.netlify.app/..."
                  className={inputClass}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !body.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Sending...' : 'Send to All Users'}
                </button>
                {(title || body || linkUrl) && (
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1.5 px-4 py-3 text-gray-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent notifications ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h2 className="font-display font-semibold text-white text-sm">Recent Notifications</h2>
              </div>
              <span className="text-xs text-gray-500">
                {notifications.length > 0 ? `${notifications.length} recent` : ''}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No notifications sent yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 -mr-1">
                {notifications.map((n) => {
                  const badge = TYPE_BADGE[n.type] || TYPE_BADGE.general;
                  return (
                    <div
                      key={n.id}
                      className="rounded-lg bg-brand-800/50 border border-white/8 p-3 hover:border-white/12 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm font-medium text-white line-clamp-1">{n.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{n.body}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                        {!n.is_read && (
                          <span className="ml-auto flex items-center gap-1 text-yellow-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Unread
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
