import Link from 'next/link';
import { Clock, Eye, ArrowRight, TrendingUp } from 'lucide-react';
import { Article } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function ArticleCard({ article, rank }: { article: Article; rank: number }) {
  const category = article.categories as any;
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  return (
    <Link href={`/blog/${article.slug}`} className="group glass-hover rounded-xl overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {article.featured_image ? (
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 to-transparent" />
        <span className="absolute top-3 left-3 text-3xl font-display font-black text-white/10 select-none">
          {String(rank).padStart(2, '0')}
        </span>
        {category && (
          <span
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: category.color || '#4a6cf7' }}
          >
            {category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-bold text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-100 transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2 flex-1">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {article.read_time}m
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatCount(article.view_count)}
          </span>
          <span className="ml-auto">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}

export default function TrendingGrid({ articles }: { articles: Article[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-pink" />
          <h2 className="font-display font-bold text-xl text-white">Trending Now</h2>
        </div>
        <Link href="/blog" className="text-sm text-brand-blue hover:text-blue-300 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.slice(0, 6).map((article, i) => (
          <ArticleCard key={article.id} article={article} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}
