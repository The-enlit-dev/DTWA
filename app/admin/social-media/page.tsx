'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Share2, Copy, Download, Trash2, Loader2, AlertCircle, Send,
  Instagram, Facebook, Twitter, Linkedin, Youtube, FileText, Cpu, Sparkles, Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const inputClass = 'w-full bg-brand-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50';

const slugify = (s: string) => s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube';

const PLATFORMS: { key: Platform; label: string; icon: any; color: string; maxLen: number; hint: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-400', maxLen: 2200, hint: 'Visual-first. Use emojis and hashtags.' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-400', maxLen: 5000, hint: 'Conversational tone. Engaging questions.' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'text-sky-400', maxLen: 280, hint: 'Short, punchy. Thread-friendly.' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-300', maxLen: 3000, hint: 'Professional tone. Industry insights.' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-400', maxLen: 5000, hint: 'Description box. SEO keywords.' },
];

const PLATFORM_BADGE: Record<Platform, string> = {
  instagram: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
  facebook: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  twitter: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
  linkedin: 'bg-blue-400/15 text-blue-300 border border-blue-400/20',
  youtube: 'bg-red-500/15 text-red-400 border border-red-500/20',
};

export default function AdminSocialMediaPage() {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [contentType, setContentType] = useState<'articles' | 'tools'>('articles');
  const [articles, setArticles] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentPlatform = PLATFORMS.find((p) => p.key === platform)!;

  const fetchAll = async () => {
    setLoading(true);
    const [artRes, toolRes, postRes] = await Promise.all([
      supabase.from('articles').select('id, title, slug, excerpt, category, published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(50),
      supabase.from('ai_tools').select('id, name, slug, short_description, category, website_url').order('created_at', { ascending: false }).limit(50),
      supabase.from('ai_generations').select('*').eq('generation_type', 'social_post').order('created_at', { ascending: false }).limit(50),
    ]);
    if (artRes.error) setError(artRes.error.message);
    if (toolRes.error) setError(toolRes.error.message);
    if (postRes.error) setError(postRes.error.message);
    setArticles(artRes.data || []);
    setTools(toolRes.data || []);
    setSavedPosts(postRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const contentList = contentType === 'articles' ? articles : tools;

  const filteredContent = contentList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const title = item.title || item.name || '';
    return title.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
  });

  const selectedItem = contentList.find((c) => c.id === selectedId);

  const generateCaption = async () => {
    if (!selectedItem) {
      setError('Please select content first.');
      return;
    }
    setGenerating(true);
    setError('');

    // Build a template caption based on platform and content type
    const title = selectedItem.title || selectedItem.name || '';
    const description = selectedItem.excerpt || selectedItem.short_description || '';
    const slug = selectedItem.slug;
    const link = contentType === 'articles'
      ? `${window.location.origin}/articles/${slug}`
      : `${window.location.origin}/tools/${slug}`;

    let template = '';
    switch (platform) {
      case 'instagram':
        template = `🚀 ${title}\n\n${description}\n\n${currentPlatform.hint}\n\n#AI #ArtificialIntelligence #TechTrends #DecodingTomorrow`;
        break;
      case 'facebook':
        template = `📊 ${title}\n\n${description}\n\nRead the full story: ${link}\n\nWhat do you think? Share your thoughts below! 👇`;
        break;
      case 'twitter':
        template = `${title}\n\n${description.slice(0, 150)}${description.length > 150 ? '...' : ''}\n\n${link}\n\n#AI #DecodingTomorrow`;
        break;
      case 'linkedin':
        template = `${title}\n\n${description}\n\nIn today's rapidly evolving AI landscape, this is worth your attention. Read our latest analysis:\n\n${link}\n\n#AI #ArtificialIntelligence #Innovation #Tech`;
        break;
      case 'youtube':
        template = `${title}\n\n${description}\n\nIn this video/article we explore the latest in AI technology.\n\n🔗 Full article: ${link}\n\n⏱ Chapters:\n0:00 Intro\n1:00 Overview\n\n#AI #ArtificialIntelligence #TechNews`;
        break;
    }

    // Enforce max length
    if (template.length > currentPlatform.maxLen) {
      template = template.slice(0, currentPlatform.maxLen - 3) + '...';
    }

    setCaption(template);
    setGenerating(false);
  };

  const savePost = async () => {
    if (!caption.trim()) {
      setError('Caption is empty. Generate or write a caption first.');
      return;
    }
    setSaving(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const title = selectedItem
      ? `${selectedItem.title || selectedItem.name} — ${currentPlatform.label}`
      : `${currentPlatform.label} post ${new Date().toLocaleDateString()}`;
    const payload: any = {
      generation_type: 'social_post',
      title: title.slice(0, 200),
      input_data: {
        content_type: contentType,
        content_id: selectedId,
        content_title: selectedItem?.title || selectedItem?.name || '',
        platform,
      },
      output_data: { caption, platform, character_count: caption.length },
      status: 'draft',
      updated_at: new Date().toISOString(),
    };
    if (user) payload.created_by = user.id;

    const { error: err } = await supabase.from('ai_generations').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setCaption('');
    setSelectedId('');
    fetchAll();
  };

  const copyToClipboard = async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      setError('Failed to copy to clipboard.');
    }
  };

  const downloadCaption = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this saved social post?')) return;
    const { error: err } = await supabase.from('ai_generations').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setSavedPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    const { error: err } = await supabase.from('ai_generations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError(err.message); return; }
    setSavedPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const charCount = caption.length;
  const overLimit = charCount > currentPlatform.maxLen;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-blue" /> Social Media Manager
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Generate social posts from existing articles and tools</p>
        </div>
      </div>

      {/* API key notice */}
      <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-300 font-medium">Social API integration coming soon.</p>
            <p className="text-xs text-yellow-400/70 mt-1">
              No social platform API keys are configured yet. The current workflow is: select content →
              generate a template caption → edit → copy to clipboard or download. Posts are saved as
              drafts in <code className="text-yellow-300">ai_generations</code> for later publishing.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-3 border border-red-500/20 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs">Dismiss</button>
        </div>
      )}

      {/* Platform tabs */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => { setPlatform(p.key); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                platform === p.key
                  ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25'
                  : 'text-gray-400 hover:text-white border border-white/8'
              }`}
            >
              <Icon className={`w-4 h-4 ${platform === p.key ? '' : p.color}`} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Content selector */}
        <div className="space-y-4">
          {/* Content type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setContentType('articles'); setSelectedId(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${contentType === 'articles' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}
            >
              <FileText className="w-4 h-4" /> Articles
            </button>
            <button
              onClick={() => { setContentType('tools'); setSelectedId(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${contentType === 'tools' ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/25' : 'text-gray-400 hover:text-white border border-white/8'}`}
            >
              <Cpu className="w-4 h-4" /> AI Tools
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${contentType}...`}
              className={`${inputClass} pl-4`}
            />
          </div>

          {/* Content list */}
          <div className="glass rounded-xl p-2 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No {contentType} found.</div>
            ) : (
              <div className="space-y-1">
                {filteredContent.map((item) => {
                  const title = item.title || item.name || '';
                  const isSelected = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${isSelected ? 'bg-brand-blue/15 border border-brand-blue/25' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <p className="text-sm text-white font-medium truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                        {contentType === 'tools' && item.short_description && (
                          <span className="text-xs text-gray-600 truncate">{item.short_description}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="glass rounded-xl p-3 border border-brand-blue/20">
              <p className="text-xs text-gray-500 mb-1">Selected:</p>
              <p className="text-sm text-white">{selectedItem.title || selectedItem.name}</p>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{selectedItem.excerpt || selectedItem.short_description}</p>
            </div>
          )}
        </div>

        {/* Right: Caption editor */}
        <div className="space-y-4">
          <div className="glass rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <currentPlatform.icon className={`w-4 h-4 ${currentPlatform.color}`} />
                {currentPlatform.label} Caption
              </h3>
              <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-gray-500'}`}>
                {charCount} / {currentPlatform.maxLen}
              </span>
            </div>
            <p className="text-xs text-gray-500">{currentPlatform.hint}</p>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={10}
              placeholder="Generate a caption or write one manually..."
              className={`${inputClass} resize-y ${overLimit ? 'border-red-500/50' : ''}`}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={generateCaption}
                disabled={generating || !selectedItem}
                className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl text-sm disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
              <button
                onClick={() => copyToClipboard(caption)}
                disabled={!caption}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/10 disabled:opacity-50"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
              <button
                onClick={() => downloadCaption(caption, `${slugify(selectedItem?.title || selectedItem?.name || 'social-post')}-${platform}.txt`)}
                disabled={!caption}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-white/10 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={savePost}
                disabled={saving || !caption}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue/10 border border-brand-blue/25 text-brand-blue rounded-xl text-sm hover:bg-brand-blue/20 disabled:opacity-50 ml-auto"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved posts */}
      <div>
        <h3 className="font-semibold text-white text-sm mb-3">Saved Social Posts</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500 glass rounded-xl">Loading...</div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-8 glass rounded-xl">
            <Share2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No saved social posts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedPosts.map((post) => {
              const output = post.output_data || {};
              const pPlatform = (output.platform || 'instagram') as Platform;
              const pCaption = output.caption || '';
              const PlatformIcon = PLATFORMS.find((p) => p.key === pPlatform)?.icon || Share2;
              return (
                <div key={post.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <PlatformIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-sm font-medium text-white truncate">{post.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${PLATFORM_BADGE[pPlatform]}`}>{pPlatform}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20 capitalize">{post.status}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-3 mb-2 whitespace-pre-wrap">{pCaption}</p>
                  <p className="text-xs text-gray-600 mb-3">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} · {pCaption.length} chars</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(pCaption, post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/10"
                    >
                      {copiedId === post.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === post.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => downloadCaption(pCaption, `${slugify(post.title)}.txt`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs hover:bg-white/10"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                    <button
                      onClick={() => updateStatus(post.id, 'published')}
                      disabled={post.status === 'published'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 text-brand-blue rounded-lg text-xs hover:bg-brand-blue/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" /> Mark Published
                    </button>
                    <button
                      onClick={() => del(post.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs hover:bg-red-500/20 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
