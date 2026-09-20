'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, X, MapPin, Users, DollarSign, Building2 } from 'lucide-react';
import { Company } from '@/lib/types';

const fundingColors: Record<string, string> = {
  'Seed': 'text-green-400 bg-green-400/10',
  'Series A': 'text-blue-400 bg-blue-400/10',
  'Series B': 'text-purple-400 bg-purple-400/10',
  'Series C': 'text-orange-400 bg-orange-400/10',
  'Series D': 'text-pink-400 bg-pink-400/10',
  'Series E': 'text-red-400 bg-red-400/10',
  'Private': 'text-yellow-400 bg-yellow-400/10',
  'Subsidiary': 'text-gray-400 bg-gray-400/10',
};

function CompanyCard({ company }: { company: Company }) {
  const fundingClass = fundingColors[company.funding_stage] || 'text-gray-400 bg-gray-400/10';

  return (
    <Link href={`/companies/${company.slug}`} className="group glass-hover rounded-xl overflow-hidden flex flex-col">
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-brand-700 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
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
              <Building2 className="w-7 h-7 text-brand-blue" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display font-bold text-white text-lg group-hover:text-blue-100 transition-colors">
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

        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {company.short_description}
        </p>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {company.total_funding && (
            <div className="bg-brand-700/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Total Funding
              </div>
              <div className="text-sm font-semibold text-white">{company.total_funding}</div>
            </div>
          )}
          {company.valuation && (
            <div className="bg-brand-700/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500 mb-0.5">Valuation</div>
              <div className="text-sm font-semibold text-white">{company.valuation}</div>
            </div>
          )}
          {company.headquarters && (
            <div className="bg-brand-700/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> HQ
              </div>
              <div className="text-sm font-semibold text-white truncate">{company.headquarters}</div>
            </div>
          )}
          {company.employees_count && (
            <div className="bg-brand-700/50 rounded-lg p-2.5">
              <div className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Employees
              </div>
              <div className="text-sm font-semibold text-white">{company.employees_count}</div>
            </div>
          )}
        </div>

        {/* Founders */}
        {company.founders?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1.5">Founders</p>
            <div className="flex flex-wrap gap-1.5">
              {company.founders.slice(0, 3).map((f) => (
                <span key={f} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/8">
          <span className="flex-1 text-sm text-brand-blue group-hover:text-blue-300 transition-colors">
            View full profile →
          </span>
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

export default function CompaniesClient({ companies }: { companies: Company[] }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');

  const filtered = useMemo(() => {
    let result = [...companies];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.short_description.toLowerCase().includes(q));
    }
    if (sort === 'popular') result.sort((a, b) => b.view_count - a.view_count);
    else if (sort === 'newest') result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sort === 'funding') result.sort((a, b) => (b.total_funding || '').localeCompare(a.total_funding || ''));
    return result;
  }, [companies, search, sort]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><X className="w-4 h-4" /></button>}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-brand-800 border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
        >
          <option value="popular">Most Viewed</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-6">{filtered.length} companies found</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((company) => <CompanyCard key={company.id} company={company} />)}
      </div>
    </div>
  );
}
