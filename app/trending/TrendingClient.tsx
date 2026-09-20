'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Cpu, Building2, Eye, Clock, Star, ArrowRight } from 'lucide-react';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const TABS = [
  { id: 'articles', label: 'Articles', icon: TrendingUp },
  { id: 'tools', label: 'AI Tools', icon: Cpu },
  { id: 'companies', label: 'Companies', icon: Building2 },
];

export default function TrendingClient({ data }: { data: any }) {
  const [tab, setTab] = useState('articles');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-brand-blue text-white'
                : 'glass text-gray-400 hover:text-white border border-white/8'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'articles' && (
        <div className="space-y-3">
          {data.articles.map((article: any, i: number) => {
            const category = article.categories;
            return (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group flex items-center gap-5 glass-hover rounded-xl p-4"
              >
                <span className="text-3xl font-display font-black text-white/10 w-10 shrink-0 text-center">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {article.featured_image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img src={article.featured_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-100 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    {category && (
                      <span className="font-medium" style={{ color: category.color }}>{category.name}</span>
                    )}
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(article.view_count)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time}m</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {tab === 'tools' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.tools.map((tool: any, i: number) => (
            <Link key={tool.id} href={`/tools/${tool.slug}`} className="group glass-hover rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-lg font-display font-black text-white/15 w-6">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm group-hover:text-blue-100">{tool.name}</h3>
                  <span className="text-xs text-gray-500">{tool.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-3 h-3 ${j < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                ))}
                <span className="text-xs text-gray-500 ml-1">{tool.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                <Eye className="w-3 h-3" /> {formatCount(tool.view_count)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'companies' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.companies.map((company: any, i: number) => (
            <Link key={company.id} href={`/companies/${company.slug}`} className="group glass-hover rounded-xl p-5">
              <div className="flex items-start gap-4 mb-3">
                <span className="text-2xl font-display font-black text-white/10 w-8">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-white text-base group-hover:text-blue-100">{company.name}</h3>
                  {company.funding_stage && <span className="text-xs text-gray-500">{company.funding_stage}</span>}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{company.short_description}</p>
              {company.valuation && (
                <p className="text-sm font-semibold text-brand-blue">Valuation: {company.valuation}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
