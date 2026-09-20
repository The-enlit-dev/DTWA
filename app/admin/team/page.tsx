'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Shield, Plus, Trash2, CheckCircle2, X as XIcon,
  Search, Loader2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

const CONTENT_TYPES = ['articles', 'tools', 'companies', 'reviews', 'newsletter', 'glossary', 'learning_resources', 'courses'] as const;
type ContentType = typeof CONTENT_TYPES[number];

const typeLabels: Record<ContentType, string> = {
  articles: 'Blog / Articles',
  tools: 'AI Tools',
  companies: 'Companies',
  reviews: 'Reviews',
  newsletter: 'Newsletter',
  glossary: 'Glossary',
  learning_resources: 'Learning Hub',
  courses: 'Courses',
};

const typeColors: Record<ContentType, string> = {
  articles: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  tools: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  companies: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  reviews: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  newsletter: 'text-green-400 bg-green-400/10 border-green-400/20',
  glossary: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  learning_resources: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  courses: 'text-red-400 bg-red-400/10 border-red-400/20',
};

interface TeamMember {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

interface Permission {
  id: string;
  user_id: string;
  content_type: ContentType;
  granted_by: string | null;
}

export default function AdminTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Search for users to promote
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  // Per-toggle saving states: key = `${userId}-${type}`
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  const [toggleError, setToggleError] = useState<Record<string, string>>({});

  // Role change states
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadTeam = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    const [{ data: profiles }, { data: perms }, myProfileResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, role, created_at')
        .in('role', ['editor', 'admin', 'super_admin'])
        .order('created_at', { ascending: false }),
      supabase.from('editor_permissions').select('*'),
      user
        ? supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    setTeamMembers(profiles || []);
    setPermissions(perms || []);
    setCurrentUserRole((myProfileResult.data as any)?.role || '');
    setLoading(false);
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, role, created_at')
      .ilike('username', `%${q}%`)
      .not('role', 'in', '("admin","super_admin")')
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const promoteToEditor = async (userId: string) => {
    setPromoting(userId);
    setError('');
    const { error: err } = await supabase
      .rpc('admin_set_user_role', { target_user_id: userId, new_role: 'editor' });
    setPromoting(null);
    if (err) {
      setError(`Failed to promote: ${err.message}`);
      return;
    }
    setSearchQuery('');
    setSearchResults([]);
    await loadTeam();
  };

  const revokeEditor = async (userId: string, username: string) => {
    if (!confirm(`Remove editor access from ${username}? They will lose all content permissions.`)) return;
    setRevoking(userId);
    setError('');

    const { error: roleErr } = await supabase
      .rpc('admin_set_user_role', { target_user_id: userId, new_role: 'user' });

    if (roleErr) {
      setRevoking(null);
      setError(`Failed to revoke role: ${roleErr.message}`);
      return;
    }

    // Clean up all permissions for this user
    const { error: permErr } = await supabase
      .from('editor_permissions')
      .delete()
      .eq('user_id', userId);

    setRevoking(null);
    if (permErr) {
      setError(`Failed to clear permissions: ${permErr.message}`);
      return;
    }
    await loadTeam();
  };

  const togglePermission = async (userId: string, contentType: ContentType, currentlyHas: boolean) => {
    const key = `${userId}-${contentType}`;
    setToggling((p) => ({ ...p, [key]: true }));
    setToggleError((p) => { const n = { ...p }; delete n[key]; return n; });

    if (currentlyHas) {
      const { error: err } = await supabase
        .rpc('revoke_editor_permission', { p_user_id: userId, p_content_type: contentType });
      if (err) {
        setToggleError((p) => ({ ...p, [key]: err.message }));
        setToggling((p) => ({ ...p, [key]: false }));
        return;
      }
      setPermissions((p) => p.filter((x) => !(x.user_id === userId && x.content_type === contentType)));
    } else {
      const { error: err } = await supabase
        .rpc('grant_editor_permission', { p_user_id: userId, p_content_type: contentType });
      if (err) {
        setToggleError((p) => ({ ...p, [key]: err.message }));
        setToggling((p) => ({ ...p, [key]: false }));
        return;
      }
      setPermissions((p) => [...p, { id: key, user_id: userId, content_type: contentType, granted_by: currentUserId }]);
    }
    setToggling((p) => ({ ...p, [key]: false }));
  };

  const getUserPerms = (userId: string): ContentType[] =>
    permissions.filter((p) => p.user_id === userId).map((p) => p.content_type as ContentType);

  const isCurrentUserAdmin = ['admin', 'super_admin'].includes(currentUserRole);

  // Non-promoted search results (regular users)
  const promotableResults = searchResults.filter((u) => u.role === 'user');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Team & Permissions</h1>
          <p className="text-gray-500 text-sm">
            {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="glass rounded-xl p-4 mb-6 border border-brand-blue/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
        <div className="text-sm text-gray-400 leading-relaxed">
          <span className="text-white font-medium">How permissions work: </span>
          Promote any registered user to <span className="text-yellow-400">Editor</span>. Then toggle which content types they can manage.
          Editor submissions go through <span className="text-yellow-400">Pending Review</span> before publishing.
          Admins have full access to everything.
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-5">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Search & Promote */}
      <div className="glass rounded-xl p-5 mb-6 border border-white/8">
        <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-blue" /> Find & Promote a User
        </h3>
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-brand-800 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
          />
        </div>

        {searchQuery && (
          <div className="mt-3 space-y-2">
            {promotableResults.length === 0 && !searching && (
              <p className="text-sm text-gray-500 px-1">
                {searchResults.length > 0
                  ? 'All matching users already have elevated roles.'
                  : 'No users found with that username.'}
              </p>
            )}
            {promotableResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5 bg-brand-800/60 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-white">{u.username}</span>
                    <div className="text-xs text-gray-600 mt-0.5">Regular user</div>
                  </div>
                </div>
                <button
                  onClick={() => promoteToEditor(u.id)}
                  disabled={promoting === u.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {promoting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Promote to Editor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading team...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="glass rounded-xl p-10 text-center text-gray-500">
            No editors yet. Search for a user above to promote them.
          </div>
        ) : (
          teamMembers.map((member) => {
            const userPerms = getUserPerms(member.id);
            const isAdmin = ['admin', 'super_admin'].includes(member.role);
            const isSelf = member.id === currentUserId;
            const canManage = isCurrentUserAdmin && !isSelf;

            return (
              <div key={member.id} className="glass rounded-xl p-5 border border-white/8 hover:border-white/12 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/15 border border-brand-blue/20 flex items-center justify-center text-brand-blue font-bold">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{member.username}</span>
                        {isSelf && <span className="text-xs text-gray-600">(you)</span>}
                      </div>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                        isAdmin ? 'bg-brand-blue/20 text-brand-blue' : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {member.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {!isAdmin && canManage && (
                    <button
                      onClick={() => revokeEditor(member.id, member.username)}
                      disabled={revoking === member.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/10 text-xs transition-colors disabled:opacity-50"
                    >
                      {revoking === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XIcon className="w-3 h-3" />}
                      Revoke Access
                    </button>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
                    Content Permissions
                    {isAdmin && <span className="text-brand-blue ml-2 normal-case tracking-normal">(full access — admins bypass permission checks)</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TYPES.map((type) => {
                      const key = `${member.id}-${type}`;
                      const hasIt = isAdmin || userPerms.includes(type);
                      const isLoading = toggling[key];
                      const errMsg = toggleError[key];

                      return (
                        <div key={type} className="flex flex-col gap-0.5">
                          <button
                            onClick={() => !isAdmin && canManage && togglePermission(member.id, type, hasIt)}
                            disabled={isAdmin || !canManage || isLoading}
                            title={!canManage ? (isSelf ? "Can't change your own permissions" : "Only admins can manage permissions") : undefined}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                              hasIt
                                ? `${typeColors[type]} border-current/30`
                                : 'bg-white/4 text-gray-500 border-white/8 hover:border-white/20 hover:text-gray-300'
                            } ${isAdmin || !canManage ? 'cursor-default opacity-70' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : hasIt ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : null}
                            {typeLabels[type]}
                          </button>
                          {errMsg && <span className="text-xs text-red-400 pl-1">{errMsg}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
