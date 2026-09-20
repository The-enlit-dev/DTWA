'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Clock, Eye, Heart, Filter, X } from 'lucide-react';
import { Article, Category } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ArticleCard({ article }: { article: Article }) {
  const category = article.categories as any;
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  return (
    <Link href={`/blog/${article.slug}`} className="group glass-hover rounded-xl overflow-hidden flex flex-col">
      <div className="relative h-48 overflow-hidden">
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/50 to-transparent" />
        {category && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: category.color || '#4a6cf7' }}
          >
            {category.name}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-white text-base leading-snug mb-2 group-hover:text-blue-100 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {article.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 pt-3 border-t border-white/6">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time}m</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(article.view_count)}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {formatCount(article.like_count)}</span>
          <span className="ml-auto">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Most Viewed' },
  { value: 'liked', label: 'Most Liked' },
];

export default function BlogClient({ articles, categories }: { articles: Article[]; categories: Category[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('latest');

  const filtered = useMemo(() => {
    let result = [...articles];

    if (activeCategory !== 'all') {
      result = result.filter((a) => (a.categories as any)?.slug === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      );
    }

    if (sort === 'trending') result.sort((a, b) => b.view_count - a.view_count);
    else if (sort === 'liked') result.sort((a, b) => b.like_count - a.like_count);

    return result;
  }, [articles, activeCategory, search, sort]);

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-brand-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-blue/50 transition-colors"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-brand-blue text-white'
              : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/8'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setActiveCategory(cat.slug)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.slug
                ? 'text-white'
                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/8'
            }`}
            style={activeCategory === cat.slug ? { backgroundColor: cat.color } : {}}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No articles found.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="mt-4 text-brand-blue hover:text-blue-300 text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
