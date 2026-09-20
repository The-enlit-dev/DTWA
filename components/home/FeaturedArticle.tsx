import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Heart, ArrowRight, Star } from 'lucide-react';
import { Article } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function FeaturedArticle({ article }: { article: Article }) {
  const category = article.categories as any;
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-brand-orange" />
          <h2 className="font-display font-bold text-xl text-white">Featured Story</h2>
        </div>
        <Link href="/blog" className="text-sm text-brand-blue hover:text-blue-300 flex items-center gap-1 transition-colors">
          All articles <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <Link href={`/blog/${article.slug}`} className="group block">
        <div className="glass-hover rounded-2xl overflow-hidden grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative h-64 md:h-auto min-h-[280px] overflow-hidden">
            {article.featured_image ? (
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full brand-gradient-bg" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-800/40" />
            {category && (
              <span
                className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: category.color || '#4a6cf7' }}
              >
                {category.name}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight mb-4 group-hover:text-blue-100 transition-colors">
              {article.title}
            </h3>
            <p className="text-gray-400 text-base leading-relaxed mb-6 line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {article.read_time} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {formatCount(article.view_count)}
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                {formatCount(article.like_count)}
              </span>
              <span className="ml-auto text-xs">{timeAgo}</span>
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-2 text-brand-blue text-sm font-medium group-hover:gap-3 transition-all">
                Read full article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
