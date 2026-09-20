'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@/lib/gamification';
import {
  Gamepad2, Search, Trash2, Eye, Users, Trophy, TrendingUp,
  RotateCcw, Loader2, DollarSign, Star, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

interface GameSave {
  id: string;
  user_id: string;
  company_name: string;
  logo_emoji: string;
  industry: string;
  turn: number;
  cash: number;
  users: number;
  revenue: number;
  employees: number;
  burn_rate: number;
  reputation: number;
  product_launches: number;
  funding_stage: string;
  funding_total: number;
  valuation: number;
  status: string;
  final_score: number;
  created_at: string;
  updated_at: string;
  profiles: { username: string | null; avatar_url: string | null; xp: number | null; level: number | null } | null;
}

interface LeaderboardRow {
  user_id: string;
  company_name: string;
  industry: string;
  final_score: number;
  valuation: number;
  funding_stage: string;
  status: string;
  updated_at: string;
  username: string | null;
  avatar_url: string | null;
}

const statusStyles: Record<string, string> = {
  active: 'bg-blue-500/15 text-blue-400',
  won: 'bg-green-500/15 text-green-400',
  failed: 'bg-red-500/15 text-red-400',
  abandoned: 'bg-gray-500/15 text-gray-400',
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-2xl text-white truncate">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminSimulatorPage() {
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [resettingAll, setResettingAll] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [
      { data: saveData },
      { data: lbData },
    ] = await Promise.all([
      supabase
        .from('game_saves')
        .select('*, profiles:user_id(username, avatar_url, xp, level)')
        .order('updated_at', { ascending: false })
        .limit(200),
      supabase
        .from('game_leaderboard')
        .select('*')
        .order('final_score', { ascending: false })
        .limit(100),
    ]);
    setSaves((saveData as GameSave[]) || []);
    setLeaderboard((lbData as LeaderboardRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Analytics derived from fetched saves
  const analytics = useMemo(() => {
    const total = saves.length;
    const active = saves.filter((s) => s.status === 'active').length;
    const won = saves.filter((s) => s.status === 'won').length;
    const failed = saves.filter((s) => s.status === 'failed').length;
    const finished = saves.filter((s) => s.status !== 'active');
    const avgScore =
      finished.length > 0
        ? Math.round(finished.reduce((sum, s) => sum + (s.final_score || 0), 0) / finished.length)
        : 0;
    const highestValuation = saves.reduce((max, s) => Math.max(max, s.valuation || 0), 0);
    return { total, active, won, failed, avgScore, highestValuation };
  }, [saves]);

  const filteredSaves = useMemo(() => {
    if (!search) return saves;
    const q = search.toLowerCase();
    return saves.filter((s) => (s.company_name || '').toLowerCase().includes(q));
  }, [saves, search]);

  const deleteSave = async (id: string) => {
    if (!confirm('Reset this player\'s simulation? This will permanently delete their save data and cannot be undone.')) return;
    setDeleting(id);
    await supabase.from('game_saves').delete().eq('id', id);
    setSaves((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  };

  const resetAll = async () => {
    if (saves.length === 0) return;
    if (
      !confirm(
        `WARNING: This will permanently delete ALL ${saves.length} simulation save(s) and wipe all simulator progress. This action cannot be undone. Are you absolutely sure?`
      )
    ) {
      return;
    }
    if (!confirm('Last chance — confirm you want to wipe ALL simulation data?')) return;
    setResettingAll(true);
    await supabase.from('game_saves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setSaves([]);
    setLeaderboard([]);
    setResettingAll(false);
  };

  const username = (s: GameSave) => s.profiles?.username || 'Unknown';
  const lbUsername = (r: LeaderboardRow) => r.username || 'Unknown';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-brand-blue" />
            Startup Simulator
          </h1>
          <p className="text-gray-500 text-sm">
            {analytics.total} game{analytics.total !== 1 ? 's' : ''} played
            {analytics.active > 0 && <span className="text-blue-400 ml-1">· {analytics.active} active</span>}
            {analytics.won > 0 && <span className="text-green-400 ml-1">· {analytics.won} won</span>}
          </p>
        </div>
        <button
          onClick={resetAll}
          disabled={resettingAll || saves.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-medium rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {resettingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {resettingAll ? 'Resetting...' : 'Reset All Data'}
        </button>
      </div>

      {/* Player Analytics */}
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Player Analytics</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={Gamepad2}
          label="Total Games"
          value={formatCount(analytics.total)}
          sub="All sessions"
          color="bg-brand-blue/15 border border-brand-blue/25 text-brand-blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Games"
          value={formatCount(analytics.active)}
          sub="In progress"
          color="bg-blue-500/15 border border-blue-500/25 text-blue-400"
        />
        <StatCard
          icon={Trophy}
          label="Games Won"
          value={formatCount(analytics.won)}
          sub="Reached unicorn"
          color="bg-green-500/15 border border-green-500/25 text-green-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Games Failed"
          value={formatCount(analytics.failed)}
          sub="Ran out of cash"
          color="bg-red-500/15 border border-red-500/25 text-red-400"
        />
        <StatCard
          icon={Star}
          label="Avg Final Score"
          value={formatCount(analytics.avgScore)}
          sub="Finished games"
          color="bg-yellow-500/15 border border-yellow-500/25 text-yellow-400"
        />
        <StatCard
          icon={DollarSign}
          label="Top Valuation"
          value={formatMoney(analytics.highestValuation)}
          sub="Highest reached"
          color="bg-purple-500/15 border border-purple-500/25 text-purple-400"
        />
      </div>

      {/* Leaderboard Management */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Leaderboard
        </h2>
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Player</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Industry</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Valuation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">No leaderboard entries yet.</td>
                  </tr>
                ) : (
                  leaderboard.map((row, i) => {
                    const save = saves.find((s) => s.user_id === row.user_id);
                    return (
                      <tr key={`${row.user_id}-${i}`} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-[10px] font-bold text-brand-blue shrink-0">
                                {(row.company_name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm text-white font-medium truncate">{row.company_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-gray-400">{lbUsername(row)}</span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-400 capitalize">{row.industry?.replace(/-/g, ' ') || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-white font-semibold">{formatCount(row.final_score || 0)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className="text-sm text-gray-300">{formatMoney(row.valuation || 0)}</span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="text-xs text-gray-400">{row.funding_stage || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyles[row.status] || statusStyles.abandoned}`}>
                            {row.status || 'unknown'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => save && deleteSave(save.id)}
                            disabled={!save || deleting === save?.id}
                            title="Reset player data"
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deleting === save?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
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

      {/* Player Saves Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-blue" />
            Player Saves
          </h2>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name..."
              className="w-full sm:w-64 bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
            />
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Player</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Turn</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Cash</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Users</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Valuation</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filteredSaves.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">
                      {search ? 'No saves match your search.' : 'No simulation saves yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredSaves.map((save) => (
                    <tr key={save.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{save.logo_emoji || '🚀'}</span>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{save.company_name || '—'}</p>
                            <p className="text-xs text-gray-600 capitalize">{save.industry?.replace(/-/g, ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-400">{username(save)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-300">{save.turn}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell">
                        <span className={`text-sm font-medium ${save.cash < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                          {formatMoney(save.cash || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-sm text-gray-400">{formatCount(save.users || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-sm text-gray-400">{formatMoney(save.revenue || 0)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell">
                        <span className="text-sm text-gray-300">{formatMoney(save.valuation || 0)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusStyles[save.status] || statusStyles.abandoned}`}>
                          {save.status || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-gray-600">
                          {save.updated_at ? formatDistanceToNow(new Date(save.updated_at), { addSuffix: true }) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            title={`Score: ${formatCount(save.final_score || 0)} · Employees: ${save.employees} · Rep: ${save.reputation}/100 · Stage: ${save.funding_stage}`}
                            className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10 transition-colors cursor-help"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                          <button
                            onClick={() => deleteSave(save.id)}
                            disabled={deleting === save.id}
                            title="Reset player data"
                            className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          >
                            {deleting === save.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
