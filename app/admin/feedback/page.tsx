'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bug, Lightbulb, MessageCircle, FileText, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-400 bg-red-400/10' },
  feature: { label: 'Feature', icon: Lightbulb, color: 'text-yellow-400 bg-yellow-400/10' },
  content: { label: 'Content', icon: FileText, color: 'text-blue-400 bg-blue-400/10' },
  general: { label: 'General', icon: MessageCircle, color: 'text-green-400 bg-green-400/10' },
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string, is_read: boolean) => {
    await supabase.from('feedback').update({ is_read }).eq('id', id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read } : i)));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    await supabase.from('feedback').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);
  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Feedback & Reports</h1>
          <p className="text-gray-500 text-sm">
            {items.length} total
            {unread > 0 && <span className="text-red-400 ml-1">· {unread} unread</span>}
          </p>
        </div>
      </div>

      {/* Type counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(typeConfig).map(([type, cfg]) => {
          const count = items.filter((i) => i.type === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? 'all' : type)}
              className={`glass rounded-xl p-3 flex items-center gap-3 transition-all text-left ${filter === type ? 'ring-1 ring-brand-blue' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                <cfg.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{count}</div>
                <div className="text-xs text-gray-500">{cfg.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'bug', 'feature', 'content', 'general'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === f ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All' : typeConfig[f]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No feedback yet.</div>
        ) : filtered.map((item) => {
          const cfg = typeConfig[item.type] || typeConfig.general;
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className={`glass rounded-xl border transition-all ${item.is_read ? 'border-white/6' : 'border-brand-blue/20'}`}>
              <div className="px-5 py-4 flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                  <cfg.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-sm">{item.subject}</span>
                      {!item.is_read && (
                        <span className="text-xs px-1.5 py-0.5 bg-brand-blue/20 text-brand-blue rounded-full">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => markRead(item.id, !item.is_read)}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-white/8 transition-colors"
                      >
                        {item.is_read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => del(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    {item.name && <span>{item.name}</span>}
                    {item.email && <span className="text-gray-600">{item.email}</span>}
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                  <button
                    onClick={() => { setExpanded(isOpen ? null : item.id); if (!item.is_read) markRead(item.id, true); }}
                    className="text-xs text-brand-blue hover:text-blue-300 transition-colors"
                  >
                    {isOpen ? 'Hide message' : 'Read message'}
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed bg-brand-800/50 rounded-lg p-3 whitespace-pre-wrap">
                      {item.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
