'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Article } from '@/lib/types';

export default function NewsTicker({ articles }: { articles: Article[] }) {
  const doubled = [...articles, ...articles];

  return (
    <div className="bg-brand-800/50 border-y border-white/6 overflow-hidden py-2.5">
      <div className="flex items-center gap-4">
        <div className="shrink-0 flex items-center gap-2 bg-brand-blue px-3 py-1 ml-4 rounded-full z-10">
          <Zap className="w-3.5 h-3.5 text-white" />
          <span className="text-white text-xs font-semibold uppercase tracking-wide">Latest</span>
        </div>

        <div className="overflow-hidden flex-1">
          <div className="flex animate-ticker whitespace-nowrap">
            {doubled.map((article, i) => (
              <Link
                key={`${article.id}-${i}`}
                href={`/blog/${article.slug}`}
                className="inline-flex items-center gap-3 mx-6 text-sm text-gray-300 hover:text-white transition-colors shrink-0"
              >
                <span className="text-brand-blue">&#x2022;</span>
                <span>{article.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
