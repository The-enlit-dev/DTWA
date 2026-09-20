'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, FileText, Cpu, Building2, BookOpen, Scale, ArrowRight } from 'lucide-react';

function highlight(text: string, query: string) {
  if (!query.trim() || !text) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-brand-blue/25 text-white rounded px-0.5">{part}</mark>
      : part
  );
}

const TYPE_ICONS: Record<string, any> = {
  article: FileText,
  tool: Cpu,
  company: Building2,
  glossary: BookOpen,
  comparison: Scale,
};

const TYPE_COLORS: Record<string, string> = {
  article: 'text-brand-blue',
  tool: 'text-cyan-400',
  company: 'text-orange-400',
  glossary: 'text-purple-400',
  comparison: 'text-green-400',
};

export default function SearchResults({ results, query }: { results: any; query: string }) {
  const [q, setQ] = useState(query);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const groups = [
    { key: 'article', label: 'Articles', items: results.articles, basePath: '/blog' },
    { key: 'tool', label: 'AI Tools', items: results.tools, basePath: '/tools' },
    { key: 'glossary', label: 'Glossary', items: results.glossary, basePath: '/glossary' },
    { key: 'company', label: 'Companies', items: results.companies, basePath: '/companies' },
    { key: 'comparison', label: 'Comparisons', items: results.comparisons, basePath: '/compare' },
  ].filter(g => g.items && g.items.length > 0);

  const filters = groups.map(g => ({ key: g.key, label: g.label, count: g.items.length }));
  const visibleGroups = activeFilter === 'all' ? groups : groups.filter(g => g.key === activeFilter);

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles, tools, glossary, companies..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue/50"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-gradient px-6 py-3 text-white font-medium rounded-xl text-sm">
          Search
        </button>
      </form>

      {/* Filter tabs */}
      {filters.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === 'all' ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            All ({filters.reduce((s, f) => s + f.count, 0)})
          </button>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === f.key ? 'bg-brand-blue text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!query && (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Enter a query to search across all content.</p>
          <p className="text-gray-600 text-sm mt-2">Try searching for &ldquo;ChatGPT&rdquo;, &ldquo;machine learning&rdquo;, or &ldquo;AI tools&rdquo;</p>
        </div>
      )}

      {query && groups.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-gray-600 text-sm mt-2">Try different keywords or browse our content.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            <Link href="/blog" className="px-4 py-2 glass border border-white/8 rounded-xl text-sm text-gray-300 hover:border-white/20">Browse Articles</Link>
            <Link href="/tools" className="px-4 py-2 glass border border-white/8 rounded-xl text-sm text-gray-300 hover:border-white/20">Browse Tools</Link>
            <Link href="/glossary" className="px-4 py-2 glass border border-white/8 rounded-xl text-sm text-gray-300 hover:border-white/20">Browse Glossary</Link>
          </div>
        </div>
      )}

      {/* Results */}
      {visibleGroups.map(group => {
        const Icon = TYPE_ICONS[group.key];
        const color = TYPE_COLORS[group.key];
        return (
          <div key={group.key} className="mb-10">
            <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} /> {group.label} ({group.items.length})
            </h2>
            <div className={group.key === 'article' || group.key === 'glossary' ? 'space-y-3' : 'grid sm:grid-cols-2 gap-3'}>
              {group.items.map((item: any) => {
                const title = item.title || item.name || item.term || `${item.tool_a_name} vs ${item.tool_b_name}`;
                const slug = item.slug;
                const desc = item.excerpt || item.short_description || item.simple_explanation || '';
                const Icon2 = TYPE_ICONS[group.key];
                return (
                  <Link key={item.id} href={`${group.basePath}/${slug}`} className="group glass-hover rounded-xl p-4 flex gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-brand-700 border border-white/8 flex items-center justify-center shrink-0 ${color}`}>
                      <Icon2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-blue-100 mb-1">
                        {highlight(title, query)}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{highlight(desc, query)}</p>
                      {item.category && <span className="text-xs mt-1.5 inline-block text-gray-600">{item.category}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
