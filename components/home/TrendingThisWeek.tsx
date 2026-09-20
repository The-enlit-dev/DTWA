import Link from 'next/link';
import { Flame, Clock, Eye, ArrowRight } from 'lucide-react';
import { Article } from '@/lib/types';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function TrendingThisWeek({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) return null;
  const top = articles[0];
  const rest = articles.slice(1, 5);

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Hot This Week</span>
          </div>
          <h2 className="font-display font-bold text-3xl text-white">Trending This Week</h2>
        </div>
        <Link href="/trending" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-blue hover:text-blue-300 transition-colors">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Featured trending */}
        <Link href={`/blog/${top.slug}`} className="group glass-hover rounded-2xl overflow-hidden flex flex-col">
          {top.featured_image && (
            <div className="aspect-video overflow-hidden">
              <img
                src={top.featured_image}
                alt={top.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-6">
            {top.categories && (
              <span className="text-xs font-medium" style={{ color: (top.categories as any).color }}>
                {(top.categories as any).name}
              </span>
            )}
            <h3 className="font-display font-bold text-xl text-white mt-2 mb-3 line-clamp-2 group-hover:text-blue-100 transition-colors">
              {top.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">{top.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {top.read_time}m read</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(top.view_count)}</span>
            </div>
          </div>
        </Link>

        {/* Secondary trending list */}
        <div className="flex flex-col gap-3">
          {rest.map((article, i) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group glass-hover rounded-xl p-4 flex items-center gap-4 flex-1"
            >
              <span className="font-display font-black text-2xl text-white/10 w-8 shrink-0 text-center">
                {String(i + 2).padStart(2, '0')}
              </span>
              {article.featured_image && (
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                  <img src={article.featured_image} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-100 transition-colors">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time}m</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(article.view_count)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
