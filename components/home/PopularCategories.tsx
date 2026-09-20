import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';
import { Category } from '@/lib/types';
import { Cpu, Building2, TrendingUp, Zap, BookOpen, Newspaper } from 'lucide-react';

const iconMap: Record<string, any> = {
  Cpu,
  Building2,
  TrendingUp,
  Zap,
  BookOpen,
  Newspaper,
  Tag,
};

export default function PopularCategories({ categories }: { categories: Category[] }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-brand-purple" />
          <h2 className="font-display font-bold text-xl text-white">Browse by Topic</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Tag;
          return (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className="group glass-hover rounded-xl p-4 flex flex-col items-center gap-3 text-center"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${cat.color}22`, border: `1px solid ${cat.color}44` }}
              >
                <Icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div>
                <div className="font-semibold text-white text-sm mb-0.5">{cat.name}</div>
                <div className="text-xs text-gray-500">{cat.article_count} articles</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
