'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Star, ExternalLink, X, ChevronDown, ChevronUp, Check, AlertCircle, Cpu } from 'lucide-react';
import { AiTool } from '@/lib/types';

const pricingColors: Record<string, string> = {
  free: 'text-green-400 bg-green-400/10 border-green-400/20',
  freemium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  open_source: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  enterprise: 'text-red-400 bg-red-400/10 border-red-400/20',
};

function ToolCard({ tool }: { tool: AiTool }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-xl overflow-hidden border border-white/8 hover:border-brand-blue/30 transition-colors">
      <div className="p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-700 border border-white/8 flex items-center justify-center shrink-0 overflow-hidden">
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  try {
                    const domain = new URL(tool.website_url).hostname;
                    e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    e.currentTarget.className = 'w-8 h-8 object-contain';
                  } catch { e.currentTarget.style.display = 'none'; }
                }}
              />
            ) : (
              <Cpu className="w-6 h-6 text-brand-blue" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display font-bold text-white text-base">{tool.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${pricingColors[tool.pricing_model] || pricingColors.freemium}`}>
                {tool.pricing_model.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{tool.category}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-white">{tool.rating.toFixed(1)}</span>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-4">{tool.short_description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        {/* Expand/collapse pros-cons */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Hide' : 'Show'} pros & cons
        </button>

        {expanded && (
          <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-white/8">
            <div>
              <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Pros
              </p>
              <ul className="space-y-1">
                {tool.pros.map((pro) => (
                  <li key={pro} className="text-xs text-gray-400 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">+</span> {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Cons
              </p>
              <ul className="space-y-1">
                {tool.cons.map((con) => (
                  <li key={con} className="text-xs text-gray-400 flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5">-</span> {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-white/8">
          <Link
            href={`/tools/${tool.slug}`}
            className="flex-1 text-center py-2 text-sm text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/10 transition-colors"
          >
            Full Review
          </Link>
          <a
            href={tool.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Visit
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ToolsClient({ tools, categories }: { tools: AiTool[]; categories: string[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [pricingFilter, setPricingFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...tools];
    if (activeCategory !== 'all') result = result.filter((t) => t.category === activeCategory);
    if (pricingFilter !== 'all') result = result.filter((t) => t.pricing_model === pricingFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.name.toLowerCase().includes(q) || t.short_description.toLowerCase().includes(q));
    }
    return result;
  }, [tools, activeCategory, pricingFilter, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AI tools..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><X className="w-4 h-4" /></button>}
        </div>
        <select
          value={pricingFilter}
          onChange={(e) => setPricingFilter(e.target.value)}
          className="bg-brand-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
        >
          <option value="all">All Pricing</option>
          <option value="free">Free</option>
          <option value="freemium">Freemium</option>
          <option value="paid">Paid</option>
          <option value="open_source">Open Source</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {['all', ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              activeCategory === cat ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {cat === 'all' ? 'All Tools' : cat}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-6">{filtered.length} tools found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
      </div>
    </div>
  );
}
