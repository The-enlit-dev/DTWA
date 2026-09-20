'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Tag, ArrowRight, X } from 'lucide-react';

interface GlossaryTerm {
  id: string;
  term: string;
  slug: string;
  simple_explanation: string;
  example: string | null;
  category: string;
  tags: string[];
}

interface Props {
  terms: GlossaryTerm[];
  categories: string[];
}

export default function GlossaryClient({ terms, categories }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLetter, setActiveLetter] = useState('');

  const filtered = useMemo(() => {
    return terms.filter((t) => {
      const matchesSearch =
        !search ||
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.simple_explanation.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      const matchesLetter = !activeLetter || t.term.toUpperCase().startsWith(activeLetter);
      return matchesSearch && matchesCategory && matchesLetter;
    });
  }, [terms, search, activeCategory, activeLetter]);

  const letters = useMemo(() =>
    Array.from(new Set(terms.map((t) => t.term[0]?.toUpperCase()))).sort(),
    [terms]
  );

  const clearFilters = () => { setSearch(''); setActiveCategory('All'); setActiveLetter(''); };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/25 rounded-full text-xs text-brand-blue font-semibold mb-5">
          <BookOpen className="w-3.5 h-3.5" /> AI Glossary
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
          Every AI Term <span className="gradient-text">Explained Simply</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {terms.length}+ AI, machine learning, and deep tech terms — each with a dedicated deep-dive page.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setActiveLetter(''); }}
          placeholder="Search any AI term..."
          className="w-full pl-11 pr-10 py-3.5 bg-brand-800/60 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-brand-blue text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/8'
            }`}
          >
            <Tag className="w-3 h-3" /> {cat}
          </button>
        ))}
      </div>

      {/* Alphabet filter */}
      <div className="flex flex-wrap gap-1.5 mb-10">
        {letters.map((l) => (
          <button
            key={l}
            onClick={() => setActiveLetter(activeLetter === l ? '' : l)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
              activeLetter === l
                ? 'bg-brand-blue text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          Showing <span className="text-white font-medium">{filtered.length}</span> term{filtered.length !== 1 ? 's' : ''}
        </p>
        {(search || activeCategory !== 'All' || activeLetter) && (
          <button onClick={clearFilters} className="text-xs text-brand-blue hover:text-blue-300 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((term) => (
            <Link
              key={term.id}
              href={`/glossary/${term.slug}`}
              className="group block glass rounded-xl p-5 border border-white/8 hover:border-brand-blue/30 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="font-display font-bold text-white text-base group-hover:text-brand-blue transition-colors">
                  {term.term}
                </h2>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 bg-white/5 border border-white/8 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {term.category}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">{term.simple_explanation}</p>
              {term.example && (
                <div className="flex items-start gap-2 p-3 bg-brand-blue/6 border border-brand-blue/15 rounded-lg">
                  <span className="text-brand-blue text-xs font-semibold shrink-0 mt-0.5">Example:</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{term.example}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No terms found matching your filters.</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-brand-blue hover:text-blue-300 transition-colors">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
