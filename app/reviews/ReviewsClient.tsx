'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Star, ExternalLink, X, ChevronDown, ChevronUp,
  Check, AlertCircle, Cpu, Building2, MapPin, Users, DollarSign,
} from 'lucide-react';
import { AiTool, Company } from '@/lib/types';

const pricingColors: Record<string, string> = {
  free: 'text-green-400 bg-green-400/10 border-green-400/20',
  freemium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  open_source: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  enterprise: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const fundingColors: Record<string, string> = {
  Seed: 'text-green-400 bg-green-400/10',
  'Series A': 'text-blue-400 bg-blue-400/10',
  'Series B': 'text-cyan-400 bg-cyan-400/10',
  'Series C': 'text-orange-400 bg-orange-400/10',
  'Series D': 'text-pink-400 bg-pink-400/10',
  Private: 'text-yellow-400 bg-yellow-400/10',
  Public: 'text-emerald-400 bg-emerald-400/10',
  Subsidiary: 'text-gray-400 bg-gray-400/10',
};

function ToolLogo({ tool }: { tool: AiTool }) {
  return (
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
  );
}

function CompanyLogo({ company }: { company: Company }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-brand-700 border border-white/8 flex items-center justify-center shrink-0 overflow-hidden">
      {company.logo_url ? (
        <img
          src={company.logo_url}
          alt={company.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            try {
              const domain = new URL(company.website_url).hostname;
              e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
              e.currentTarget.className = 'w-8 h-8 object-contain';
            } catch { e.currentTarget.style.display = 'none'; }
          }}
        />
      ) : (
        <Building2 className="w-6 h-6 text-brand-blue" />
      )}
    </div>
  );
}

function ToolCard({ tool }: { tool: AiTool }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-xl border border-white/8 hover:border-brand-blue/30 transition-all duration-200 flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <ToolLogo tool={tool} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-display font-bold text-white text-base leading-tight">{tool.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${pricingColors[tool.pricing_model] || pricingColors.freemium}`}>
                {tool.pricing_model.replace('_', ' ')}
              </span>
            </div>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{tool.category}</span>
          </div>
        </div>

        {/* Rating bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-white">{tool.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-600">/ 5.0 · Attharva's rating</span>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">{tool.short_description}</p>

        {/* Tags */}
        {tool.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tool.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {/* Pros / Cons toggle */}
        {(tool.pros?.length > 0 || tool.cons?.length > 0) && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-3 w-fit"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide' : 'Show'} pros & cons
            </button>

            {expanded && (
              <div className="grid grid-cols-2 gap-3 mb-4 pt-3 border-t border-white/8">
                <div>
                  <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Pros
                  </p>
                  <ul className="space-y-1">
                    {tool.pros.map((p) => (
                      <li key={p} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">+</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Cons
                  </p>
                  <ul className="space-y-1">
                    {tool.cons.map((c) => (
                      <li key={c} className="text-xs text-gray-400 flex items-start gap-1.5">
                        <span className="text-red-500 mt-0.5 shrink-0">-</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-white/8 mt-auto">
          <Link
            href={`/tools/${tool.slug}`}
            className="flex-1 text-center py-2 text-sm text-brand-blue border border-brand-blue/30 rounded-lg hover:bg-brand-blue/10 transition-colors"
          >
            Full Review
          </Link>
          {tool.website_url && (
            <a
              href={tool.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const fundingClass = fundingColors[company.funding_stage] || 'text-gray-400 bg-gray-400/10';

  return (
    <Link href={`/companies/${company.slug}`} className="group glass rounded-xl border border-white/8 hover:border-brand-blue/30 transition-all duration-200 flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <CompanyLogo company={company} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display font-bold text-white text-base leading-tight group-hover:text-blue-100 transition-colors">
                {company.name}
              </h3>
              {company.is_featured && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/20 border border-brand-blue/30 text-brand-blue">
                  Featured
                </span>
              )}
            </div>
            {company.funding_stage && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${fundingClass}`}>
                {company.funding_stage}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {company.short_description}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {company.total_funding && (
            <div className="bg-brand-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Funding
              </div>
              <div className="text-xs font-semibold text-white">{company.total_funding}</div>
            </div>
          )}
          {company.valuation && (
            <div className="bg-brand-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-0.5">Valuation</div>
              <div className="text-xs font-semibold text-white">{company.valuation}</div>
            </div>
          )}
          {company.headquarters && (
            <div className="bg-brand-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> HQ
              </div>
              <div className="text-xs font-semibold text-white truncate">{company.headquarters}</div>
            </div>
          )}
          {company.employees_count && (
            <div className="bg-brand-700/50 rounded-lg p-2">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Employees
              </div>
              <div className="text-xs font-semibold text-white">{company.employees_count}</div>
            </div>
          )}
        </div>

        {company.founders?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Founders</p>
            <div className="flex flex-wrap gap-1.5">
              {company.founders.slice(0, 3).map((f) => (
                <span key={f} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-auto">
          <span className="text-sm text-brand-blue group-hover:text-blue-300 transition-colors">View profile →</span>
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-500 hover:text-white border border-white/8 rounded-lg hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ReviewsClient({ tools, companies }: { tools: AiTool[]; companies: Company[] }) {
  const [tab, setTab] = useState<'tools' | 'companies'>('tools');
  const [search, setSearch] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(
    () => Array.from(new Set(tools.map((t) => t.category))).filter(Boolean),
    [tools]
  );

  const filteredTools = useMemo(() => {
    let res = [...tools];
    if (categoryFilter !== 'all') res = res.filter((t) => t.category === categoryFilter);
    if (pricingFilter !== 'all') res = res.filter((t) => t.pricing_model === pricingFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter((t) => t.name.toLowerCase().includes(q) || (t.short_description || '').toLowerCase().includes(q));
    }
    return res;
  }, [tools, search, pricingFilter, categoryFilter]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.short_description || '').toLowerCase().includes(q)
    );
  }, [companies, search]);

  const clearSearch = () => setSearch('');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => { setTab('tools'); setSearch(''); setPricingFilter('all'); setCategoryFilter('all'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'tools'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/8'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI Tool Reviews
          <span className={`text-xs px-2 py-0.5 rounded-full ${tab === 'tools' ? 'bg-white/20' : 'bg-white/8'}`}>
            {tools.length}
          </span>
        </button>
        <button
          onClick={() => { setTab('companies'); setSearch(''); setPricingFilter('all'); setCategoryFilter('all'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'companies'
              ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/8'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Company Profiles
          <span className={`text-xs px-2 py-0.5 rounded-full ${tab === 'companies' ? 'bg-white/20' : 'bg-white/8'}`}>
            {companies.length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'tools' ? 'Search AI tools...' : 'Search companies...'}
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {tab === 'tools' && (
          <>
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
              <option value="enterprise">Enterprise</option>
            </select>
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-brand-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        {tab === 'tools' ? `${filteredTools.length} tool reviews` : `${filteredCompanies.length} company profiles`}
      </p>

      {/* Grid */}
      {tab === 'tools' ? (
        filteredTools.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No tools match your filters.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
          </div>
        )
      ) : (
        filteredCompanies.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No companies found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((company) => <CompanyCard key={company.id} company={company} />)}
          </div>
        )
      )}
    </div>
  );
}
