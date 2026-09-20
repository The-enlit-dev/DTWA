'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Target, Plus, Search, Trash2, Edit, Award, Star, Loader2, X, Check,
  Users, TrendingUp, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['AI Basics', 'Prompt Engineering', 'LLMs', 'RAG', 'AI Agents', 'Automation', 'Fine-Tuning', 'AI Business'];

interface SkillNodeRow {
  id: string;
  category: string;
  node_key: string;
  title: string;
  description: string;
  xp_reward: number;
  difficulty: number;
  prerequisites: string[];
  resource_url: string;
  order: number;
  created_at: string;
}

interface BadgeRow {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xp_reward: number;
  requirement: string;
  created_at: string;
}

export default function AdminSkillsPage() {
  const [tab, setTab] = useState<'nodes' | 'badges' | 'analytics'>('nodes');
  const [nodes, setNodes] = useState<SkillNodeRow[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [editingNode, setEditingNode] = useState<SkillNodeRow | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [nodeForm, setNodeForm] = useState({ title: '', category: 'AI Basics', description: '', xp_reward: 50, difficulty: 1, prerequisites: '', order: 0, resource_url: '' });
  const [badgeForm, setBadgeForm] = useState({ name: '', description: '', icon: 'Award', color: '#4A6CF7', xp_reward: 100, requirement: '' });

  // Analytics state
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [totalBadgeAwards, setTotalBadgeAwards] = useState(0);
  const [topNodes, setTopNodes] = useState<{ title: string; count: number }[]>([]);

  const fetchData = useCallback(async () => {
    const [nodesRes, badgesRes, completionsRes, badgeAwardsRes, progressRes] = await Promise.all([
      supabase.from('skill_nodes').select('*').order('order', { ascending: true }),
      supabase.from('badges').select('*').order('created_at', { ascending: false }),
      supabase.from('user_skill_progress').select('id', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('user_badges').select('id', { count: 'exact', head: true }),
      supabase.from('user_skill_progress').select('node_id').eq('completed', true),
    ]);
    setNodes((nodesRes.data || []) as SkillNodeRow[]);
    setBadges((badgesRes.data || []) as BadgeRow[]);
    setTotalCompletions(completionsRes.count || 0);
    setTotalBadgeAwards(badgeAwardsRes.count || 0);

    // Compute top completed nodes
    const counts: Record<string, number> = {};
    (progressRes.data || []).forEach((r: any) => { counts[r.node_id] = (counts[r.node_id] || 0) + 1; });
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nodeId, count]) => ({ title: (nodesRes.data || []).find((n: any) => n.id === nodeId)?.title || 'Unknown', count }));
    setTopNodes(top);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeForm.title.trim()) return;
    setActing('form-node');
    const prereqs = nodeForm.prerequisites.split(',').map((s) => s.trim()).filter(Boolean);
    const nodeKey = editingNode
      ? editingNode.node_key
      : nodeForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const payload = {
      category: nodeForm.category,
      node_key: nodeKey,
      title: nodeForm.title.trim(),
      description: nodeForm.description.trim(),
      xp_reward: Number(nodeForm.xp_reward),
      difficulty: Number(nodeForm.difficulty),
      prerequisites: prereqs,
      order: Number(nodeForm.order),
      resource_url: nodeForm.resource_url.trim(),
    };

    if (editingNode) {
      await supabase.from('skill_nodes').update(payload).eq('id', editingNode.id);
    } else {
      await supabase.from('skill_nodes').insert(payload);
    }
    setActing(null);
    setShowNodeForm(false);
    setEditingNode(null);
    setNodeForm({ title: '', category: 'AI Basics', description: '', xp_reward: 50, difficulty: 1, prerequisites: '', order: 0, resource_url: '' });
    fetchData();
  };

  const editNode = (node: SkillNodeRow) => {
    setEditingNode(node);
    setNodeForm({
      title: node.title,
      category: node.category,
      description: node.description,
      xp_reward: node.xp_reward,
      difficulty: node.difficulty,
      prerequisites: node.prerequisites.join(', '),
      order: node.order,
      resource_url: node.resource_url,
    });
    setShowNodeForm(true);
  };

  const deleteNode = async (id: string) => {
    if (!confirm('Delete this skill node? User progress for this node will also be removed.')) return;
    setActing(id);
    await supabase.from('skill_nodes').delete().eq('id', id);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setActing(null);
  };

  const submitBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeForm.name.trim()) return;
    setActing('form-badge');
    const badgeKey = badgeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^-|-$/g, '');
    const payload = {
      badge_key: badgeKey,
      name: badgeForm.name.trim(),
      description: badgeForm.description.trim(),
      icon: badgeForm.icon,
      color: badgeForm.color,
      xp_reward: Number(badgeForm.xp_reward),
      requirement: badgeForm.requirement.trim(),
    };
    await supabase.from('badges').insert(payload);
    setActing(null);
    setShowBadgeForm(false);
    setBadgeForm({ name: '', description: '', icon: 'Award', color: '#4A6CF7', xp_reward: 100, requirement: '' });
    fetchData();
  };

  const deleteBadge = async (id: string) => {
    if (!confirm('Delete this badge? User awards for this badge will also be removed.')) return;
    setActing(id);
    await supabase.from('badges').delete().eq('id', id);
    setBadges((prev) => prev.filter((b) => b.id !== id));
    setActing(null);
  };

  const filteredNodes = nodes.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.category.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Skill Tree & Badges</h1>
          <p className="text-gray-500 text-sm">{nodes.length} nodes · {badges.length} badges</p>
        </div>
        <div className="flex gap-2">
          {tab !== 'analytics' && (
            <button
              onClick={() => { setEditingNode(null); setShowNodeForm(tab === 'nodes' ? !showNodeForm : false); setShowBadgeForm(tab === 'badges' ? !showBadgeForm : false); }}
              className="flex items-center gap-2 px-4 py-2.5 btn-gradient text-white font-medium rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" /> {tab === 'nodes' ? 'New Node' : 'New Badge'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { id: 'nodes' as const, label: 'Skill Nodes', icon: Target },
          { id: 'badges' as const, label: 'Badges', icon: Award },
          { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-blue text-white' : 'glass text-gray-400 hover:text-white border border-white/8'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Target} label="Skill Nodes" value={nodes.length} color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={Award} label="Badges" value={badges.length} color="bg-yellow-500/10 text-yellow-400" />
            <StatCard icon={Check} label="Completions" value={totalCompletions} color="bg-green-500/10 text-green-400" />
            <StatCard icon={Users} label="Badge Awards" value={totalBadgeAwards} color="bg-blue-500/10 text-blue-400" />
          </div>
          {topNodes.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-blue" /> Most Completed Skills
              </h3>
              <div className="space-y-3">
                {topNodes.map((n, i) => {
                  const max = topNodes[0]?.count || 1;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{i + 1}. {n.title}</span>
                        <span className="text-xs text-gray-500">{n.count} completions</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(n.count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nodes tab */}
      {tab === 'nodes' && (
        <div>
          {showNodeForm && (
            <form onSubmit={submitNode} className="glass rounded-xl p-5 mb-5 border border-brand-blue/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm">{editingNode ? 'Edit Node' : 'Create Skill Node'}</h3>
                <button type="button" onClick={() => { setShowNodeForm(false); setEditingNode(null); }} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Title *" value={nodeForm.title} onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <select value={nodeForm.category} onChange={(e) => setNodeForm({ ...nodeForm, category: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="XP Reward" value={nodeForm.xp_reward} onChange={(e) => setNodeForm({ ...nodeForm, xp_reward: Number(e.target.value) })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50" />
                <select value={nodeForm.difficulty} onChange={(e) => setNodeForm({ ...nodeForm, difficulty: Number(e.target.value) })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50">
                  <option value={1}>Difficulty 1 (Easy)</option>
                  <option value={2}>Difficulty 2 (Medium)</option>
                  <option value={3}>Difficulty 3 (Hard)</option>
                </select>
                <input type="text" placeholder="Prerequisites (comma-separated keys)" value={nodeForm.prerequisites} onChange={(e) => setNodeForm({ ...nodeForm, prerequisites: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <input type="number" placeholder="Order" value={nodeForm.order} onChange={(e) => setNodeForm({ ...nodeForm, order: Number(e.target.value) })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50" />
                <input type="text" placeholder="Resource URL" value={nodeForm.resource_url} onChange={(e) => setNodeForm({ ...nodeForm, resource_url: e.target.value })} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <textarea placeholder="Description" value={nodeForm.description} onChange={(e) => setNodeForm({ ...nodeForm, description: e.target.value })} rows={2} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
              </div>
              <button type="submit" disabled={acting === 'form-node'} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                {acting === 'form-node' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingNode ? 'Update Node' : 'Create Node'}
              </button>
            </form>
          )}

          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search nodes..." className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 max-w-sm" />
          </div>

          <div className="glass rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">XP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Diff</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Order</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{node.title}</p>
                      <p className="text-xs text-gray-600 truncate max-w-xs">{node.description}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400">{node.category}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-brand-blue">{node.xp_reward}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs ${node.difficulty === 3 ? 'text-red-400' : node.difficulty === 2 ? 'text-yellow-400' : 'text-green-400'}`}>{'★'.repeat(node.difficulty)}</span></td>
                    <td className="px-4 py-3"><span className="text-sm text-gray-400">{node.order}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => editNode(node)} className="p-1.5 text-gray-500 hover:text-brand-blue rounded-lg hover:bg-brand-blue/10"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteNode(node.id)} disabled={acting === node.id} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredNodes.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-500">No skill nodes found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Badges tab */}
      {tab === 'badges' && (
        <div>
          {showBadgeForm && (
            <form onSubmit={submitBadge} className="glass rounded-xl p-5 mb-5 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white text-sm">Create Badge</h3>
                <button type="button" onClick={() => setShowBadgeForm(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Badge name *" value={badgeForm.name} onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <input type="text" placeholder="Icon (lucide name)" value={badgeForm.icon} onChange={(e) => setBadgeForm({ ...badgeForm, icon: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <input type="color" placeholder="Color" value={badgeForm.color} onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm h-12" />
                <input type="number" placeholder="XP Reward" value={badgeForm.xp_reward} onChange={(e) => setBadgeForm({ ...badgeForm, xp_reward: Number(e.target.value) })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50" />
                <input type="text" placeholder="Requirement" value={badgeForm.requirement} onChange={(e) => setBadgeForm({ ...badgeForm, requirement: e.target.value })} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
                <textarea placeholder="Description" value={badgeForm.description} onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })} rows={2} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
              </div>
              <button type="submit" disabled={acting === 'form-badge'} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                {acting === 'form-badge' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create Badge
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="glass rounded-xl p-5 relative group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${badge.color}20`, border: `1px solid ${badge.color}40` }}>
                    <Star className="w-5 h-5" style={{ color: badge.color }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">{badge.name}</h4>
                    <p className="text-xs text-gray-600">{badge.badge_key}</p>
                  </div>
                  <button onClick={() => deleteBadge(badge.id)} disabled={acting === badge.id} className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {acting === badge.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{badge.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-blue">+{badge.xp_reward} XP</span>
                  {badge.requirement && <span className="text-gray-600">· {badge.requirement}</span>}
                </div>
              </div>
            ))}
            {badges.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center py-10 text-gray-500">No badges yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="font-display font-bold text-2xl text-white">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
