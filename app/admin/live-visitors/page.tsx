'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, Users, Eye, Monitor, Smartphone, Tablet, Globe, Clock, TrendingUp, RefreshCw } from 'lucide-react';

interface SessionData {
  id: string;
  session_id: string;
  page: string;
  referrer: string;
  device_type: string;
  country: string;
  started_at: string;
  last_active: string;
}

interface PageViewData {
  page: string;
  count: number;
}

const deviceIcons: Record<string, any> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const timeRanges = [
  { label: 'Live', minutes: 5 },
  { label: '30 min', minutes: 30 },
  { label: 'Today', minutes: null as number | null },
  { label: '7 days', minutes: null as number | null, days: 7 },
  { label: '30 days', minutes: null as number | null, days: 30 },
];

export default function LiveVisitorsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [pageViews, setPageViews] = useState<PageViewData[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [deviceBreakdown, setDeviceBreakdown] = useState<Record<string, number>>({});
  const [topReferrers, setTopReferrers] = useState<{ referrer: string; count: number }[]>([]);
  const [activeRange, setActiveRange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    const range = timeRanges[activeRange];
    let since: Date;
    if (range.minutes !== null) {
      since = new Date(Date.now() - range.minutes * 60 * 1000);
    } else if (range.days) {
      since = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000);
    } else {
      since = new Date();
      since.setHours(0, 0, 0, 0);
    }

    const [sessionsRes, viewsRes] = await Promise.all([
      supabase
        .from('visitor_sessions')
        .select('*')
        .gte('last_active', since.toISOString())
        .order('last_active', { ascending: false })
        .limit(500),
      supabase
        .from('page_views')
        .select('page, referrer, device_type, created_at')
        .gte('created_at', since.toISOString())
        .limit(5000),
    ]);

    const activeSessions = (sessionsRes.data || []) as SessionData[];
    setSessions(activeSessions);

    const views = (viewsRes.data || []) as any[];
    setTotalViews(views.length);
    setUniqueVisitors(new Set(views.map((v) => v.session_id || v.page)).size || activeSessions.length);

    // Page view breakdown
    const pageMap: Record<string, number> = {};
    views.forEach((v) => {
      pageMap[v.page] = (pageMap[v.page] || 0) + 1;
    });
    setPageViews(
      Object.entries(pageMap)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)
    );

    // Device breakdown
    const devMap: Record<string, number> = {};
    views.forEach((v) => {
      devMap[v.device_type] = (devMap[v.device_type] || 0) + 1;
    });
    setDeviceBreakdown(devMap);

    // Top referrers
    const refMap: Record<string, number> = {};
    views.forEach((v) => {
      const ref = v.referrer || 'Direct';
      if (ref !== 'Direct') {
        try {
          const url = new URL(ref);
          const domain = url.hostname.replace('www.', '');
          refMap[domain] = (refMap[domain] || 0) + 1;
        } catch {
          refMap[ref] = (refMap[ref] || 0) + 1;
        }
      } else {
        refMap['Direct'] = (refMap['Direct'] || 0) + 1;
      }
    });
    setTopReferrers(
      Object.entries(refMap)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );

    setLoading(false);
    setLastUpdate(new Date());
  }, [activeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const liveCount = sessions.filter(
    (s) => new Date(s.last_active).getTime() > Date.now() - 5 * 60 * 1000
  ).length;

  const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" /> Live Visitors
          </h1>
          <p className="text-gray-500 text-sm">Real-time visitor analytics — updates every 10 seconds</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {lastUpdate.toLocaleTimeString()}
          </span>
          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-white glass rounded-lg border border-white/8 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Time range tabs */}
      <div className="flex gap-2 flex-wrap">
        {timeRanges.map((range, i) => (
          <button
            key={i}
            onClick={() => { setActiveRange(i); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeRange === i
                ? 'btn-gradient text-white'
                : 'glass text-gray-400 border border-white/8 hover:text-white hover:border-white/18'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Live count banner */}
      {activeRange === 0 && (
        <div className="glass rounded-2xl border border-green-500/20 p-6 flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <Users className="w-7 h-7 text-green-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-3xl text-white">{liveCount}</div>
            <div className="text-sm text-green-400">visitors active right now</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-brand-blue" />
            <span className="text-xs text-gray-500">Page Views</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{totalViews.toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-500">Unique Visitors</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{uniqueVisitors.toLocaleString()}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-500">Active Sessions</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{sessions.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-500">Pages Tracked</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">{pageViews.length}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-blue" /> Top Pages
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {pageViews.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">No page views in this period.</div>
            ) : (
              pageViews.map((pv, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-600 w-5 shrink-0">{i + 1}</span>
                    <span className="text-sm text-gray-300 truncate">{pv.page}</span>
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">{pv.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Device + referrer breakdown */}
        <div className="space-y-4">
          {/* Devices */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" /> Device Types
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(deviceBreakdown).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No data</p>
              ) : (
                Object.entries(deviceBreakdown).map(([device, count]) => {
                  const Icon = deviceIcons[device] || Monitor;
                  const pct = totalViews > 0 ? Math.round((count / totalViews) * 100) : 0;
                  return (
                    <div key={device}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-2 text-sm text-gray-300 capitalize">
                          <Icon className="w-3.5 h-3.5" /> {device}
                        </span>
                        <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full btn-gradient rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" /> Traffic Sources
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {topReferrers.length === 0 ? (
                <div className="px-5 py-6 text-center text-gray-500 text-sm">No referrer data yet.</div>
              ) : (
                topReferrers.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-white/3 transition-colors">
                    <span className="text-sm text-gray-300 truncate">{ref.referrer}</span>
                    <span className="text-sm font-semibold text-white shrink-0">{ref.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active sessions list */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" /> Active Sessions
          </h2>
          <span className="text-xs text-gray-500">{sessions.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Page</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Device</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Source</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No active sessions in this period.</td></tr>
              ) : (
                sessions.slice(0, 50).map((s) => {
                  const isActive = new Date(s.last_active).getTime() > Date.now() - 5 * 60 * 1000;
                  const Icon = deviceIcons[s.device_type] || Monitor;
                  const refDomain = s.referrer ? (() => {
                    try { return new URL(s.referrer).hostname.replace('www.', ''); }
                    catch { return s.referrer; }
                  })() : 'Direct';
                  return (
                    <tr key={s.id} className="hover:bg-white/2">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {isActive && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" />}
                          <span className="text-sm text-gray-300 truncate max-w-xs">{s.page}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 capitalize">
                          <Icon className="w-3.5 h-3.5" /> {s.device_type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <span className="text-xs text-gray-400 truncate max-w-[120px] block">{refDomain}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-xs text-gray-500">
                          {new Date(s.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
