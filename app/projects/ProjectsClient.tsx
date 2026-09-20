'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';
import { Flame, TrendingUp, Clock, ArrowUp, MessageCircle, ExternalLink, Github, Plus, Loader2, ChevronUp, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type ProjectWithCreator = Project & { profiles: { username: string; avatar_url: string } | null };

export function ProjectsClient({ trending, top, newest }: {
  trending: ProjectWithCreator[];
  top: ProjectWithCreator[];
  newest: ProjectWithCreator[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'trending' | 'top' | 'newest'>('trending');
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', tagline: '', description: '', website_url: '', github_url: '', tags: '' });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        const { data: votes } = await supabase.from('project_upvotes').select('project_id').eq('user_id', session.user.id);
        setUpvoted(new Set((votes || []).map((v: any) => v.project_id)));
      }
    })();
  }, []);

  const toggleUpvote = async (project: Project) => {
    if (!userId) { router.push('/auth/login'); return; }
    const isUpvoted = upvoted.has(project.id);
    if (isUpvoted) {
      await supabase.from('project_upvotes').delete().eq('project_id', project.id).eq('user_id', userId);
      setUpvoted(new Set([...upvoted].filter((id) => id !== project.id)));
    } else {
      await supabase.from('project_upvotes').insert({ project_id: project.id, user_id: userId });
      setUpvoted(new Set([...upvoted, project.id]));
      await supabase.rpc('award_xp', { target_user_id: userId, xp_amount: 5, activity_type: 'project_upvote', activity_title: `Upvoted ${project.title}`, activity_link: '/projects' });
    }
    router.refresh();
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { router.push('/auth/login'); return; }
    if (!formData.title.trim()) return;
    setSubmitting(true);
    const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const { error } = await supabase.from('projects').insert({
      title: formData.title.trim(),
      slug,
      tagline: formData.tagline.trim(),
      description: formData.description.trim(),
      website_url: formData.website_url.trim(),
      github_url: formData.github_url.trim(),
      tags,
      creator_id: userId,
      status: 'published',
    });
    if (!error) {
      await supabase.rpc('award_xp', { target_user_id: userId, xp_amount: 100, activity_type: 'project_publish', activity_title: `Published ${formData.title}`, activity_link: '/projects' });
      setFormData({ title: '', tagline: '', description: '', website_url: '', github_url: '', tags: '' });
      setShowSubmit(false);
      router.refresh();
    }
    setSubmitting(false);
  };

  const current = tab === 'trending' ? trending : tab === 'top' ? top : newest;

  return (
    <div>
      {/* Tabs + Submit button */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex gap-2">
          {([
            { id: 'trending' as const, label: 'Trending', icon: Flame },
            { id: 'top' as const, label: 'Most Upvoted', icon: TrendingUp },
            { id: 'newest' as const, label: 'Newest', icon: Clock },
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
        <button
          onClick={() => userId ? setShowSubmit(!showSubmit) : router.push('/auth/login')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Submit Project
        </button>
      </div>

      {/* Submit form */}
      {showSubmit && (
        <form onSubmit={submitProject} className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-white">Submit Your Project</h3>
            <button type="button" onClick={() => setShowSubmit(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Project title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
            <input type="text" placeholder="Tagline" value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
            <input type="url" placeholder="Website URL" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
            <input type="url" placeholder="GitHub URL" value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} className="bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
            <input type="text" placeholder="Tags (comma-separated)" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="sm:col-span-2 bg-brand-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-blue/50" />
          </div>
          <button type="submit" disabled={submitting || !formData.title.trim()} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Publish
          </button>
        </form>
      )}

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {current.map((project) => (
          <ProjectCard key={project.id} project={project} upvoted={upvoted.has(project.id)} onUpvote={() => toggleUpvote(project)} />
        ))}
      </div>

      {current.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No projects yet.</p>
          <p className="text-sm text-gray-600">Be the first to submit one!</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, upvoted, onUpvote }: { project: ProjectWithCreator; upvoted: boolean; onUpvote: () => void }) {
  const creator = project.profiles;
  return (
    <div id={project.slug} className="glass-hover rounded-2xl overflow-hidden flex flex-col group">
      <div className="p-5 flex flex-col flex-1">
        {/* Upvote + title */}
        <div className="flex items-start gap-3 mb-3">
          <button
            onClick={onUpvote}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all shrink-0 ${
              upvoted ? 'bg-brand-blue/20 border-brand-blue/40 text-brand-blue' : 'bg-brand-800 border-white/8 text-gray-500 hover:text-white hover:border-white/20'
            }`}
          >
            <ChevronUp className={`w-5 h-5 ${upvoted ? 'fill-brand-blue' : ''}`} />
            <span className="text-xs font-bold">{project.upvote_count}</span>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-lg group-hover:text-blue-100 transition-colors line-clamp-1">
              {project.title}
            </h3>
            {project.tagline && <p className="text-sm text-gray-500 line-clamp-1">{project.tagline}</p>}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3 flex-1">{project.description || project.tagline}</p>

        {/* Tags */}
        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-white/5 text-gray-400 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {/* Footer: creator + links */}
        <div className="flex items-center gap-3 pt-3 border-t border-white/8">
          {creator && (
            <Link href={`/u/${creator.username}`} className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-xs text-brand-blue font-bold shrink-0">
                {creator.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-500 truncate">{creator.username}</span>
            </Link>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {project.website_url && (
              <a href={project.website_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-white border border-white/8 rounded-lg hover:bg-white/5 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-white border border-white/8 rounded-lg hover:bg-white/5 transition-colors">
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <MessageCircle className="w-3 h-3" /> {project.comment_count}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2">{formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</p>
      </div>
    </div>
  );
}
