import Link from 'next/link';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import { Article } from '@/lib/types';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function RelatedArticles({ articles }: { articles: Article[] }) {
  return (
    <section>
      <h2 className="font-display font-bold text-xl text-white mb-6">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {articles.map((article) => {
          const category = article.categories as any;
          return (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group glass-hover rounded-xl overflow-hidden">
              {article.featured_image && (
                <div className="h-36 overflow-hidden">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4">
                {category && (
                  <span className="text-xs font-medium" style={{ color: category.color }}>
                    {category.name}
                  </span>
                )}
                <h3 className="font-semibold text-white text-sm mt-1 mb-2 line-clamp-2 group-hover:text-blue-100 transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.read_time}m</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(article.view_count)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
