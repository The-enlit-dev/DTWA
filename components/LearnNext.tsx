'use client';

import { GraduationCap, FileText, Cpu, BookOpen, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonBox } from '@/components/ui/skeletons';

interface LearnNextProps {
  tags: string[];
  categorySlug: string;
  excludeId: string;
  contentType: string;
}

interface Recommendation {
  id: string;
  title: string;
  slug: string;
  type: 'article' | 'tool' | 'glossary';
  href: string;
}

export default function LearnNext({ tags, categorySlug, excludeId, contentType }: LearnNextProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Recommendation[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const results: Recommendation[] = [];

      try {
        if (contentType === 'article') {
          // Articles with matching tags or same category
          const { data } = await supabase
            .from('articles')
            .select('id, title, slug, categories!inner(slug)')
            .eq('status', 'published')
            .neq('id', excludeId)
            .or(`tags.cs.{${tags.join(',')}},categories.slug.eq.${categorySlug}`)
            .order('published_at', { ascending: false })
            .limit(3);
          (data || []).forEach((a: any) => {
            results.push({ id: a.id, title: a.title, slug: a.slug, type: 'article', href: `/blog/${a.slug}` });
          });
        } else if (contentType === 'tool') {
          // Tools in same category
          const { data } = await supabase
            .from('ai_tools')
            .select('id, name, slug, category')
            .eq('category', categorySlug)
            .neq('id', excludeId)
            .order('view_count', { ascending: false })
            .limit(3);
          (data || []).forEach((t: any) => {
            results.push({ id: t.id, title: t.name, slug: t.slug, type: 'tool', href: `/tools/${t.slug}` });
          });
        } else if (contentType === 'glossary') {
          // Glossary terms with matching category
          const { data } = await supabase
            .from('glossary_terms')
            .select('id, term, slug, category')
            .eq('status', 'published')
            .eq('category', categorySlug)
            .neq('id', excludeId)
            .order('view_count', { ascending: false })
            .limit(3);
          (data || []).forEach((g: any) => {
            results.push({ id: g.id, title: g.term, slug: g.slug, type: 'glossary', href: `/glossary/${g.slug}` });
          });
        }

        // Also fetch 2 related glossary terms
        const { data: glossaryData } = await supabase
          .from('glossary_terms')
          .select('id, term, slug')
          .eq('status', 'published')
          .neq('id', excludeId)
          .order('view_count', { ascending: false })
          .limit(2);
        (glossaryData || []).forEach((g: any) => {
          if (!results.some((r) => r.id === g.id)) {
            results.push({ id: g.id, title: g.term, slug: g.slug, type: 'glossary', href: `/glossary/${g.slug}` });
          }
        });
      } catch {
        /* ignore */
      }

      if (mounted) {
        setItems(results);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [tags, categorySlug, excludeId, contentType]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-brand-blue" />
          <h3 className="font-display font-bold text-lg text-white">Learn Next</h3>
        </div>
        <div className="space-y-3">
          <SkeletonBox className="h-16 w-full" />
          <SkeletonBox className="h-16 w-full" />
          <SkeletonBox className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const typeBadge = (type: Recommendation['type']) => {
    const map = {
      article: { label: 'Article', icon: FileText, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
      tool: { label: 'Tool', icon: Cpu, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
      glossary: { label: 'Glossary', icon: BookOpen, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    };
    const m = map[type];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${m.color}`}>
        <m.icon className="w-3 h-3" />
        {m.label}
      </span>
    );
  };

  return (
    <div className="glass rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-brand-blue" />
        <h3 className="font-display font-bold text-lg text-white">Learn Next</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 hover:border-brand-blue/30 hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {typeBadge(item.type)}
              <span className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                {item.title}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-brand-blue group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
