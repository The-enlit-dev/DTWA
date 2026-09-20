import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { NewsArticle } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { NewsClient } from './NewsClient';
import { Flame, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'AI News — Latest Developments in Artificial Intelligence',
  description:
    'Breaking AI news and analysis — funding rounds, model launches, policy changes, and product releases from the companies shaping tomorrow.',
  keywords: ['AI news', 'artificial intelligence news', 'AI funding', 'AI models', 'AI policy', 'tech news'],
  openGraph: {
    title: 'AI News | Decoding Tomorrow With Attharva',
    description: 'Breaking AI news and analysis — funding, models, policy, and products.',
    type: 'website',
    url: `${SITE_URL}/news`,
  },
  twitter: { card: 'summary_large_image', title: 'AI News | Decoding Tomorrow', description: 'Breaking AI news and analysis.' },
  alternates: { canonical: `${SITE_URL}/news` },
};

async function getNews() {
  const [trendingRes, latestRes] = await Promise.all([
    supabase.from('news_articles').select('*').eq('is_trending', true).order('published_at', { ascending: false }).limit(4),
    supabase.from('news_articles').select('*').order('published_at', { ascending: false }).limit(24),
  ]);
  return {
    trending: (trendingRes.data || []) as NewsArticle[],
    latest: (latestRes.data || []) as NewsArticle[],
  };
}

export default async function NewsPage() {
  const { trending, latest } = await getNews();
  const featured = trending[0] || latest[0] || null;
  const restTrending = trending.filter((t) => t.id !== featured?.id).slice(0, 3);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI News',
    itemListElement: latest.slice(0, 10).map((n, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/news#${n.slug}`,
      name: n.title,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">AI News</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">The Latest in AI</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Breaking developments in artificial intelligence — funding, models, policy, and products, explained simply.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Trending section */}
          {featured && (
            <section className="mb-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" /> Trending Now
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <NewsCardLarge article={featured} />
                <div className="grid sm:grid-cols-1 gap-4">
                  {restTrending.map((a) => <NewsCardSmall key={a.id} article={a} />)}
                </div>
              </div>
            </section>
          )}

          {/* Latest section with category filter */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl text-white">Latest News</h2>
            </div>
            <NewsClient articles={latest} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function NewsCardLarge({ article }: { article: NewsArticle }) {
  const timeAgo = article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : '';
  return (
    <article id={article.slug} className="glass rounded-2xl overflow-hidden flex flex-col group">
      {article.image_url && (
        <Link href={article.source_url || '#'} target="_blank" rel="noopener noreferrer" className="block aspect-video overflow-hidden">
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </Link>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-orange-400/10 border border-orange-400/20 text-orange-400 font-medium">{article.category}</span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <h3 className="font-display font-bold text-xl text-white leading-tight mb-3 line-clamp-2">{article.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">{article.summary}</p>
        <div className="mt-auto flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-white/8">
          <span>{article.source_name}</span>
          {article.source_url && (
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-brand-blue hover:text-blue-300">
              Read <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function NewsCardSmall({ article }: { article: NewsArticle }) {
  const timeAgo = article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : '';
  return (
    <article id={article.slug} className="glass rounded-xl p-4 flex gap-4 group">
      {article.image_url && (
        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 font-medium">{article.category}</span>
          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-100 transition-colors">{article.title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
      </div>
    </article>
  );
}
