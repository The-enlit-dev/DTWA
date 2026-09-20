'use client';

import { useState, useMemo } from 'react';
import { NewsArticle } from '@/lib/types';

export function NewsClient({ articles }: { articles: NewsArticle[] }) {
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>(articles.map((a) => a.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (category === 'All') return articles;
    return articles.filter((a) => a.category === category);
  }, [articles, category]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              category === cat
                ? 'bg-brand-blue text-white'
                : 'glass text-gray-400 hover:text-white border border-white/8'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-16">No news in this category yet.</p>
      )}
    </div>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const timeAgo = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return (
    <article id={article.slug} className="glass rounded-xl overflow-hidden flex flex-col group">
      {article.image_url && (
        <div className="h-44 overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue font-medium">
            {article.category}
          </span>
          {article.is_trending && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400">
              Trending
            </span>
          )}
        </div>
        <h3 className="font-display font-bold text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-blue-100 transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">{article.summary}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/8">
          <span>{article.source_name}</span>
          <span>{timeAgo}</span>
        </div>
      </div>
    </article>
  );
}
