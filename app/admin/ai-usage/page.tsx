'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart2, Activity, CheckCircle, XCircle, Database, Zap, Clock, TrendingUp, Loader2 } from 'lucide-react';

export default function AdminAIUsagePage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [today, month, success, failed, cached, logs, settingsRes] = await Promise.all([
        supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()).in('status', ['success', 'failed']),
        supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()).in('status', ['success', 'failed']),
        supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'success'),
        supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('ai_usage_log').select('*', { count: 'exact', head: true }).eq('status', 'cached'),
        supabase.from('ai_usage_log').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('ai_settings').select('*').limit(1).maybeSingle(),
      ]);

      const dailyLimit = settingsRes.data?.daily_request_limit || 50;
      const used = today.count || 0;

      setStats({
        today: used,
        month: month.count || 0,
        success: success.count || 0,
        failed: failed.count || 0,
        cached: cached.count || 0,
        dailyLimit,
        remaining: Math.max(0, dailyLimit - used),
        provider: settingsRes.data?.provider || 'openrouter',
        model: settingsRes.data?.model || 'openrouter/free',
        aiEnabled: settingsRes.data?.ai_enabled ?? true,
      });
      setRecentLogs(logs.data || []);
      setSettings(settingsRes.data);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>;
  }

  const usagePct = stats.dailyLimit > 0 ? Math.min(100, (stats.today / stats.dailyLimit) * 100) : 0;

  const STATUS_COLORS: Record<string, string> = {
    success: 'text-green-400 bg-green-400/10',
    failed: 'text-red-400 bg-red-400/10',
    cached: 'text-blue-400 bg-blue-400/10',
    rate_limited: 'text-orange-400 bg-orange-400/10',
    disabled: 'text-gray-400 bg-gray-400/10',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-brand-blue" /> AI Usage
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Monitor AI API consumption and limits</p>
      </div>

      {/* Daily usage bar */}
      <div className="glass rounded-2xl p-5 border border-white/8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-400" /> Daily Request Usage
          </h3>
          <span className={`text-sm font-bold ${usagePct >= 80 ? 'text-red-400' : usagePct >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
            {stats.today} / {stats.dailyLimit}
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${usagePct >= 80 ? 'bg-red-500' : usagePct >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{stats.remaining} requests remaining today</span>
          <span className={stats.aiEnabled ? 'text-green-400' : 'text-red-400'}>
            AI is {stats.aiEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-brand-blue" />
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.today}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.month}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500">Successful</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.success}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500">Cached Hits</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{stats.cached}</div>
        </div>
      </div>

      {/* Provider info */}
      <div className="glass rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center">
          <Zap className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <p className="text-sm text-white font-medium">Provider: <span className="text-brand-blue capitalize">{stats.provider}</span></p>
          <p className="text-xs text-gray-500">Model: {stats.model}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {stats.failed > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <XCircle className="w-3.5 h-3.5" /> {stats.failed} failed
            </span>
          )}
        </div>
      </div>

      {/* Recent logs */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Recent AI Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Feature</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Model</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Tokens</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {recentLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No AI requests yet.</td></tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2">
                    <td className="px-4 py-2.5 text-sm text-gray-300">{log.feature.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell">{log.model}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[log.status] || STATUS_COLORS.disabled}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden sm:table-cell text-right">{log.tokens_used || 0}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 text-right">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
