'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, FileText, Download, Eye, Filter, X, BookOpen, Sparkles, Brain, Network, Bot, MessageSquare, Briefcase, Wrench, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const iconMap: Record<string, any> = {
  BookOpen, Sparkles, Brain, Network, Bot, MessageSquare, Briefcase, Wrench, FileText,
};

const fileTypeColors: Record<string, string> = {
  pdf: 'text-red-400 bg-red-400/10 border-red-400/20',
  ppt: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  pptx: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  doc: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  docx: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  image: 'text-green-400 bg-green-400/10 border-green-400/20',
  link: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  other: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export default function LearningHubClient() {
  const [resources, setResources] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'downloads'>('newest');

  useEffect(() => {
    (async () => {
      const [resRes, catRes] = await Promise.all([
        supabase
          .from('learning_resources')
          .select('*, category:learning_categories(id, name, slug, icon)')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('learning_categories').select('*').order('sort_order', { ascending: true }),
      ]);
      setResources(resRes.data || []);
      setCategories(catRes.data || []);
      setLoading(false);
    })();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    resources.forEach((r) => r.tags?.forEach((t: string) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    let result = [...resources];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.category?.slug === selectedCategory);
    }
    if (selectedTag !== 'all') {
      result = result.filter((r) => r.tags?.includes(selectedTag));
    }
    if (sortBy === 'popular') {
      result.sort((a, b) => b.view_count - a.view_count);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.download_count - a.download_count);
    }
    return result;
  }, [resources, search, selectedCategory, selectedTag, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/10 mb-5">
          <BookOpen className="w-3.5 h-3.5 text-brand-blue" />
          <span className="text-xs font-medium text-gray-300">{resources.length} resources available</span>
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          Learning <span className="gradient-text">Hub</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Explore a curated library of AI resources — PDFs, study notes, cheat sheets, guides, and research papers.
          Download, view online, and learn at your own pace.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl border border-white/8 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources, tags, topics..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-blue/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-all cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Viewed</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedTag === 'all' ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-white/5 text-gray-400 border border-white/8 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 15).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTag === tag ? 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30' : 'bg-white/5 text-gray-400 border border-white/8 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedCategory === 'all' ? 'btn-gradient text-white' : 'glass text-gray-400 border border-white/8 hover:text-white hover:border-white/18'
          }`}
        >
          All Resources
        </button>
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || BookOpen;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat.slug ? 'btn-gradient text-white' : 'glass text-gray-400 border border-white/8 hover:text-white hover:border-white/18'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
          {selectedCategory !== 'all' && ` in ${categories.find((c) => c.slug === selectedCategory)?.name}`}
        </p>
      </div>

      {/* Resource cards */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl border border-white/8 py-20 text-center">
          <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No resources found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((resource) => {
            const Icon = iconMap[resource.category?.icon] || FileText;
            return (
              <Link
                key={resource.id}
                href={`/learning-hub/${resource.slug}`}
                className="group glass rounded-2xl border border-white/8 hover:border-white/18 transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-brand-blue/15 to-purple-500/10 flex items-center justify-center overflow-hidden">
                  {resource.thumbnail_url ? (
                    <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="w-10 h-10 text-brand-blue/60" />
                      <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-lg border ${fileTypeColors[resource.file_type] || fileTypeColors.other}`}>
                        {resource.file_type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {resource.category && (
                      <span className="text-[10px] font-semibold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                        {resource.category.name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-white text-base mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{resource.description}</p>

                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {resource.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" /> {resource.download_count}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-brand-blue group-hover:gap-2 transition-all">
                      View <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
