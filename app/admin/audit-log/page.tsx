'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ScrollText,
  Loader2,
  AlertCircle,
  X as XIcon,
  Search,
  ChevronDown,
  History,
} from 'lucide-react';

const inputClass =
  'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  details: any;
  created_at: string;
}

const PAGE_SIZE = 50;

const actionColors: Record<string, string> = {
  create: 'bg-green-500/15 text-green-400',
  update: 'bg-blue-500/15 text-blue-400',
  delete: 'bg-red-500/15 text-red-400',
  publish: 'bg-purple-500/15 text-purple-400',
  unpublish: 'bg-yellow-500/15 text-yellow-400',
  login: 'bg-brand-blue/15 text-brand-blue',
  logout: 'bg-gray-500/15 text-gray-400',
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const buildQuery = useCallback(
    (offset: number) => {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (dateFilter) {
        const start = new Date(dateFilter);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter);
        end.setHours(23, 59, 59, 999);
        query = query
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }
      return query;
    },
    [actionFilter, dateFilter]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await buildQuery(0);
    if (err) {
      setError(err.message);
    } else {
      setLogs((data || []) as AuditLog[]);
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    const offset = logs.length;
    const { data, error: err } = await buildQuery(offset);
    if (err) {
      setError(err.message);
    } else {
      setLogs((prev) => [...prev, ...((data || []) as AuditLog[])]);
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoadingMore(false);
  };

  // Available action types (derived from loaded data + common defaults)
  const actionTypes = useMemo(() => {
    const set = new Set<string>([
      'create',
      'update',
      'delete',
      'publish',
      'unpublish',
      'login',
      'logout',
    ]);
    logs.forEach((l) => set.add(l.action));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.actor_name || '').toLowerCase().includes(q) ||
        (l.entity_title || '').toLowerCase().includes(q)
    );
  }, [logs, search]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-brand-blue" /> Audit Log
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Read-only record of admin actions
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 flex-1">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400/50 hover:text-red-400"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">
              Search actor or entity
            </label>
            <Search className="absolute left-3 top-[38px] -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className={`${inputClass} pl-10`}
            />
          </div>
          {/* Action filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Action type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All actions</option>
              {actionTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {/* Date filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {(actionFilter !== 'all' || dateFilter || search) && (
          <button
            onClick={() => {
              setActionFilter('all');
              setDateFilter('');
              setSearch('');
            }}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Actor
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                Entity Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Entity Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-brand-blue animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {search || actionFilter !== 'all' || dateFilter
                      ? 'No log entries match your filters.'
                      : 'No audit log entries yet.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
                        {(log.actor_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white">
                        {log.actor_name || 'System'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        actionColors[log.action] ||
                        'bg-gray-500/15 text-gray-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400">
                      {log.entity_type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-300">
                      {log.entity_title || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-gray-500">
                      {formatDate(log.created_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {!loading && filtered.length > 0 && hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
