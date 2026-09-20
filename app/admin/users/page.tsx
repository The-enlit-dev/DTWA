'use client';

import { Fragment, useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Users, Search, Ban, Shield, Star, Award, Zap, Eye, Loader2,
  X, Check, TrendingUp, AlertTriangle, Crown, Flame, ChevronDown,
  UserCog,
} from 'lucide-react';

type Role = 'user' | 'editor' | 'admin' | 'super_admin';
type SortKey = 'xp' | 'level' | 'reputation' | 'newest';
type RoleFilter = 'all' | Role;
type BanFilter = 'all' | 'banned' | 'active';

interface Profile {
  id: string;
  username: string;
  role: Role;
  xp: number;
  level: number;
  streak_days: number;
  reputation: number;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  created_at: string;
}

interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  xp_reward: number;
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  user: 'User',
};

const ROLE_BADGE_CLASSES: Record<Role, string> = {
  super_admin: 'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
  admin: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  editor: 'bg-green-500/15 text-green-400 border-green-500/25',
  user: 'bg-white/6 text-gray-400 border-white/10',
};

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'user', label: 'User' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'xp', label: 'XP (High→Low)' },
  { value: 'level', label: 'Level (High→Low)' },
  { value: 'reputation', label: 'Reputation (High→Low)' },
];

const BAN_FILTERS: { value: BanFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];

function StatCard({
  icon: Icon, label, value, color,
}: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 border border-white/8">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-display font-bold text-white leading-none">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Filters
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [banFilter, setBanFilter] = useState<BanFilter>('all');

  // Action states keyed by user id
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>({});

  // Expandable action panels per user
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-user inputs
  const [xpInputs, setXpInputs] = useState<Record<string, string>>({});
  const [badgeSelects, setBadgeSelects] = useState<Record<string, string>>({});
  const [roleSelects, setRoleSelects] = useState<Record<string, Role>>({});

  const isSuperAdmin = currentUserRole === 'super_admin';

  const clearTransient = useCallback((userId: string, kind: 'error' | 'success') => {
    if (kind === 'error') {
      setActionError((p) => { const n = { ...p }; delete n[userId]; return n; });
    } else {
      setActionSuccess((p) => { const n = { ...p }; delete n[userId]; return n; });
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated.');
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const [profilesRes, badgesRes, meRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, role, xp, level, streak_days, reputation, is_banned, banned_at, banned_reason, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('badges').select('id, badge_key, name, description, icon, color, xp_reward').order('name', { ascending: true }),
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    ]);

    if (profilesRes.error) {
      setError(`Failed to load users: ${profilesRes.error.message}`);
      setLoading(false);
      return;
    }

    setProfiles((profilesRes.data as Profile[]) || []);
    setBadges((badgesRes.data as Badge[]) || []);
    setCurrentUserRole((meRes.data as any)?.role || '');
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let list = [...profiles];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.username.toLowerCase().includes(q));
    if (roleFilter !== 'all') list = list.filter((p) => p.role === roleFilter);
    if (banFilter === 'banned') list = list.filter((p) => p.is_banned);
    if (banFilter === 'active') list = list.filter((p) => !p.is_banned);

    list.sort((a, b) => {
      switch (sort) {
        case 'xp': return b.xp - a.xp;
        case 'level': return b.level - a.level;
        case 'reputation': return b.reputation - a.reputation;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [profiles, search, sort, roleFilter, banFilter]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const banned = profiles.filter((p) => p.is_banned).length;
    const totalXp = profiles.reduce((s, p) => s + (p.xp || 0), 0);
    const avgLevel = total > 0
      ? (profiles.reduce((s, p) => s + (p.level || 0), 0) / total).toFixed(1)
      : '0.0';
    return { total, banned, totalXp, avgLevel };
  }, [profiles]);

  const setBusy = (userId: string, key: string) =>
    setActionLoading((p) => ({ ...p, [userId]: key }));

  const clearBusy = (userId: string) =>
    setActionLoading((p) => { const n = { ...p }; delete n[userId]; return n; });

  const flashError = (userId: string, msg: string) => {
    setActionError((p) => ({ ...p, [userId]: msg }));
    setActionSuccess((p) => { const n = { ...p }; delete n[userId]; return n; });
  };

  const flashSuccess = (userId: string, msg: string) => {
    setActionSuccess((p) => ({ ...p, [userId]: msg }));
    setActionError((p) => { const n = { ...p }; delete n[userId]; return n; });
    setTimeout(() => clearTransient(userId, 'success'), 3500);
  };

  const refreshProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, xp, level, streak_days, reputation, is_banned, banned_at, banned_reason, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (data) {
      setProfiles((prev) => prev.map((p) => (p.id === userId ? (data as Profile) : p)));
    }
  };

  const handleBanToggle = async (user: Profile) => {
    clearTransient(user.id, 'error');
    if (user.is_banned) {
      if (!confirm(`Unban @${user.username}? They will be able to use the platform again.`)) return;
      setBusy(user.id, 'ban');
      const { error: err } = await supabase.rpc('admin_set_ban_status', {
        target_user_id: user.id,
        ban: false,
        reason: '',
      });
      clearBusy(user.id);
      if (err) { flashError(user.id, err.message); return; }
      flashSuccess(user.id, 'User unbanned');
      await refreshProfile(user.id);
    } else {
      const reason = prompt(`Ban @${user.username}? Enter a reason (shown to moderation log):`)?.trim();
      if (reason === undefined) return; // cancelled
      if (!reason) {
        flashError(user.id, 'A ban reason is required.');
        return;
      }
      setBusy(user.id, 'ban');
      const { error: err } = await supabase.rpc('admin_set_ban_status', {
        target_user_id: user.id,
        ban: true,
        reason,
      });
      clearBusy(user.id);
      if (err) { flashError(user.id, err.message); return; }
      flashSuccess(user.id, 'User banned');
      await refreshProfile(user.id);
    }
  };

  const handleRoleChange = async (user: Profile) => {
    clearTransient(user.id, 'error');
    const newRole = roleSelects[user.id] || user.role;
    if (newRole === user.role) {
      flashError(user.id, 'Select a different role first.');
      return;
    }
    if (!confirm(`Change @${user.username}'s role to ${ROLE_LABELS[newRole]}?`)) return;
    setBusy(user.id, 'role');
    const { error: err } = await supabase.rpc('admin_set_user_role', {
      target_user_id: user.id,
      new_role: newRole,
    });
    clearBusy(user.id);
    if (err) { flashError(user.id, err.message); return; }
    flashSuccess(user.id, `Role set to ${ROLE_LABELS[newRole]}`);
    setRoleSelects((p) => { const n = { ...p }; delete n[user.id]; return n; });
    await refreshProfile(user.id);
  };

  const handleAwardBadge = async (user: Profile) => {
    clearTransient(user.id, 'error');
    const badgeId = badgeSelects[user.id];
    if (!badgeId) {
      flashError(user.id, 'Select a badge first.');
      return;
    }
    const badge = badges.find((b) => b.id === badgeId);
    if (!confirm(`Award the "${badge?.name}" badge to @${user.username}?`)) return;
    setBusy(user.id, 'badge');
    const { error: err } = await supabase
      .from('user_badges')
      .insert({ user_id: user.id, badge_id: badgeId });
    clearBusy(user.id);
    if (err) {
      flashError(user.id, err.code === '23505' ? 'User already has this badge.' : err.message);
      return;
    }
    flashSuccess(user.id, `Awarded "${badge?.name}"`);
    setBadgeSelects((p) => { const n = { ...p }; delete n[user.id]; return n; });
  };

  const handleAdjustXp = async (user: Profile) => {
    clearTransient(user.id, 'error');
    const raw = xpInputs[user.id];
    if (raw === undefined || raw === '') {
      flashError(user.id, 'Enter an XP amount.');
      return;
    }
    const amount = parseInt(raw, 10);
    if (Number.isNaN(amount) || amount === 0) {
      flashError(user.id, 'Enter a non-zero integer (use negative to subtract).');
      return;
    }
    setBusy(user.id, 'xp');
    const { error: err } = await supabase.rpc('award_xp', {
      target_user_id: user.id,
      xp_amount: amount,
      activity_type: 'admin_adjustment',
      activity_title: 'Admin XP adjustment',
      activity_link: null as any,
    });
    clearBusy(user.id);
    if (err) { flashError(user.id, err.message); return; }
    flashSuccess(user.id, `${amount > 0 ? '+' : ''}${amount} XP applied`);
    setXpInputs((p) => { const n = { ...p }; delete n[user.id]; return n; });
    await refreshProfile(user.id);
  };

  const selectClass =
    'bg-brand-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-brand-blue/50 transition-colors';
  const inputClass = selectClass;
  const btnBase =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Users className="w-3.5 h-3.5 text-brand-blue" />
            <span>Administration</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">User Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats.total} user{stats.total !== 1 ? 's' : ''} · {stats.banned} banned
          </p>
        </div>
        {!isSuperAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-xs text-yellow-400 max-w-md">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>You&apos;re an admin. Role changes require <strong className="text-yellow-300">Super Admin</strong>.</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.total} color="bg-brand-blue/15 border border-brand-blue/25 text-brand-blue" />
        <StatCard icon={Ban} label="Banned Users" value={stats.banned} color="bg-red-500/15 border border-red-500/25 text-red-400" />
        <StatCard icon={Zap} label="Total XP in System" value={stats.totalXp.toLocaleString()} color="bg-yellow-500/15 border border-yellow-500/25 text-yellow-400" />
        <StatCard icon={TrendingUp} label="Average Level" value={stats.avgLevel} color="bg-green-500/15 border border-green-500/25 text-green-400" />
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 border border-white/8 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username..."
              className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClass}
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-brand-800">{o.label}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className={selectClass}
              aria-label="Filter by role"
            >
              {ROLE_FILTERS.map((o) => (
                <option key={o.value} value={o.value} className="bg-brand-800">{o.label}</option>
              ))}
            </select>
            <select
              value={banFilter}
              onChange={(e) => setBanFilter(e.target.value as BanFilter)}
              className={selectClass}
              aria-label="Filter by ban status"
            >
              {BAN_FILTERS.map((o) => (
                <option key={o.value} value={o.value} className="bg-brand-800">{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {(search || roleFilter !== 'all' || banFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setRoleFilter('all'); setBanFilter('all'); }}
            className="self-start text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No users match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-white/8">
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold text-right">XP</th>
                  <th className="px-4 py-3 font-semibold text-right">Lvl</th>
                  <th className="px-4 py-3 font-semibold text-right">Streak</th>
                  <th className="px-4 py-3 font-semibold text-right">Reputation</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((user) => {
                  const isBusy = !!actionLoading[user.id];
                  const busyKey = actionLoading[user.id];
                  const isExpanded = expanded === user.id;
                  const isSelf = user.id === currentUserId;

                  return (
                    <Fragment key={user.id}>
                      <tr
                        className={`hover:bg-white/3 transition-colors ${user.is_banned ? 'bg-red-500/[0.04]' : ''}`}
                      >
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-blue/15 border border-brand-blue/20 flex items-center justify-center text-brand-blue font-bold text-xs shrink-0">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-white truncate font-medium">{user.username}</span>
                                {user.role === 'super_admin' && <Crown className="w-3.5 h-3.5 text-brand-blue shrink-0" />}
                                {isSelf && <span className="text-xs text-gray-600">(you)</span>}
                              </div>
                              {user.is_banned && user.banned_reason && (
                                <div className="text-[11px] text-red-400/80 truncate max-w-[200px]" title={user.banned_reason}>
                                  {user.banned_reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${ROLE_BADGE_CLASSES[user.role]}`}>
                            {user.role === 'super_admin' && <Crown className="w-3 h-3" />}
                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                            {user.role === 'editor' && <UserCog className="w-3 h-3" />}
                            {ROLE_LABELS[user.role]}
                          </span>
                        </td>
                        {/* XP */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-white font-semibold tabular-nums">{(user.xp || 0).toLocaleString()}</span>
                        </td>
                        {/* Level */}
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded-md bg-brand-blue/15 text-brand-blue text-xs font-bold tabular-nums">
                            {user.level || 0}
                          </span>
                        </td>
                        {/* Streak */}
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-gray-300 tabular-nums">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            {user.streak_days || 0}
                          </span>
                        </td>
                        {/* Reputation */}
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-gray-300 tabular-nums">
                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                            {user.reputation || 0}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          {user.is_banned ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                            </span>
                          )}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/u/${user.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View profile"
                              className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleBanToggle(user)}
                              disabled={isBusy || isSelf}
                              title={isSelf ? "Can't ban yourself" : (user.is_banned ? 'Unban user' : 'Ban user')}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                user.is_banned
                                  ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                                  : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                              }`}
                            >
                              {isBusy && busyKey === 'ban' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.is_banned ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setExpanded(isExpanded ? null : user.id)}
                              title="More actions"
                              className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'text-brand-blue bg-brand-blue/10' : 'text-gray-400 hover:text-white hover:bg-white/8'}`}
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-brand-900/40">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              {/* Role change */}
                              <div className="glass rounded-xl p-4 border border-white/8">
                                <div className="flex items-center gap-2 mb-3">
                                  <Shield className="w-4 h-4 text-brand-blue" />
                                  <h4 className="text-sm font-semibold text-white">Change Role</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={roleSelects[user.id] ?? user.role}
                                    onChange={(e) => setRoleSelects((p) => ({ ...p, [user.id]: e.target.value as Role }))}
                                    disabled={!isSuperAdmin || isBusy}
                                    title={!isSuperAdmin ? 'Only Super Admins can change roles' : undefined}
                                    className={`${selectClass} flex-1 ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    {(['user', 'editor', 'admin', 'super_admin'] as Role[]).map((r) => (
                                      <option key={r} value={r} className="bg-brand-800">{ROLE_LABELS[r]}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleRoleChange(user)}
                                    disabled={!isSuperAdmin || isBusy || isSelf}
                                    title={!isSuperAdmin ? 'Only Super Admins can change roles' : isSelf ? "Can't change your own role" : undefined}
                                    className={`${btnBase} bg-brand-blue hover:bg-blue-500 text-white`}
                                  >
                                    {isBusy && busyKey === 'role' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCog className="w-3 h-3" />}
                                    Apply
                                  </button>
                                </div>
                                {!isSuperAdmin && (
                                  <p className="text-[11px] text-yellow-400/80 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Super Admin only.
                                  </p>
                                )}
                              </div>

                              {/* Award badge */}
                              <div className="glass rounded-xl p-4 border border-white/8">
                                <div className="flex items-center gap-2 mb-3">
                                  <Award className="w-4 h-4 text-yellow-400" />
                                  <h4 className="text-sm font-semibold text-white">Award Badge</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={badgeSelects[user.id] ?? ''}
                                    onChange={(e) => setBadgeSelects((p) => ({ ...p, [user.id]: e.target.value }))}
                                    disabled={isBusy}
                                    className={`${selectClass} flex-1`}
                                  >
                                    <option value="" className="bg-brand-800">Select badge...</option>
                                    {badges.map((b) => (
                                      <option key={b.id} value={b.id} className="bg-brand-800">
                                        {b.name} (+{b.xp_reward} XP)
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleAwardBadge(user)}
                                    disabled={isBusy || !badgeSelects[user.id]}
                                    className={`${btnBase} bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 border border-yellow-500/25`}
                                  >
                                    {isBusy && busyKey === 'badge' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                                    Award
                                  </button>
                                </div>
                                {badges.length === 0 && (
                                  <p className="text-[11px] text-gray-500 mt-2">No badges defined yet.</p>
                                )}
                              </div>

                              {/* Adjust XP */}
                              <div className="glass rounded-xl p-4 border border-white/8">
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap className="w-4 h-4 text-brand-blue" />
                                  <h4 className="text-sm font-semibold text-white">Adjust XP</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={xpInputs[user.id] ?? ''}
                                    onChange={(e) => setXpInputs((p) => ({ ...p, [user.id]: e.target.value }))}
                                    placeholder="e.g. 100 or -50"
                                    disabled={isBusy}
                                    className={`${inputClass} flex-1 tabular-nums`}
                                  />
                                  <button
                                    onClick={() => handleAdjustXp(user)}
                                    disabled={isBusy}
                                    className={`${btnBase} bg-brand-blue hover:bg-blue-500 text-white`}
                                  >
                                    {isBusy && busyKey === 'xp' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                    Apply
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-2">Use a negative number to subtract XP.</p>
                              </div>
                            </div>

                            {/* Feedback row */}
                            {(actionError[user.id] || actionSuccess[user.id]) && (
                              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs max-w-md">
                                {actionError[user.id] ? (
                                  <span className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                                    <AlertTriangle className="w-3.5 h-3.5" /> {actionError[user.id]}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-lg">
                                    <Check className="w-3.5 h-3.5" /> {actionSuccess[user.id]}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Showing {filtered.length} of {stats.total} users
        </p>
      )}
    </div>
  );
}
