'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Flag, CheckCircle, XCircle, Trash2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

const REPORT_TYPES: Record<string, string> = {
  incorrect_info: 'Incorrect information',
  broken_link: 'Broken link',
  outdated: 'Outdated information',
  typo: 'Typo',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  resolved: 'bg-green-500/15 text-green-400 border border-green-500/20',
  ignored: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
};

export default function AdminContentReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    setReports(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status, resolved_at: status !== 'open' ? new Date().toISOString() : null };
    if (status !== 'open') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) updates.resolved_by = user.id;
    }
    const { error: err } = await supabase.from('content_reports').update(updates).eq('id', id);
    if (err) { setError(err.message); return; }
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const del = async (id: string) => {
    if (!confirm('Delete this report permanently?')) return;
    const { error: err } = await supabase.from('content_reports').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const openCount = reports.filter(r => r.status === 'open').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-orange-400" /> Content Reports
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Issues reported by visitors · {openCount} open
        </p>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'resolved', 'ignored'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            {s} ({s === 'all' ? reports.length : reports.filter(r => r.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Flag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No reports {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <div key={report.id} className="glass rounded-xl p-4 border border-white/8">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-400">{REPORT_TYPES[report.report_type] || report.report_type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[report.status]}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-white">
                    {report.content_type}: {report.content_slug || report.content_id}
                  </p>
                  {report.description && (
                    <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                  )}
                  {report.reporter_email && (
                    <p className="text-xs text-gray-600 mt-1">Reported by: {report.reporter_email}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                {report.content_slug && (
                  <a
                    href={`/${report.content_type === 'article' ? 'blog' : report.content_type === 'tool' ? 'tools' : report.content_type === 'glossary' ? 'glossary' : report.content_type}/${report.content_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-white glass rounded-lg border border-white/8 shrink-0"
                    title="View content"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2">
                {report.status === 'open' && (
                  <>
                    <button onClick={() => updateStatus(report.id, 'resolved')} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/25 text-green-400 rounded-lg text-xs hover:bg-green-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                    <button onClick={() => updateStatus(report.id, 'ignored')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 border border-gray-500/25 text-gray-400 rounded-lg text-xs hover:bg-gray-500/20">
                      <XCircle className="w-3.5 h-3.5" /> Ignore
                    </button>
                  </>
                )}
                {report.status !== 'open' && (
                  <button onClick={() => updateStatus(report.id, 'open')} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-lg text-xs hover:bg-orange-500/20">
                    Reopen
                  </button>
                )}
                <button onClick={() => del(report.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 ml-auto">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
