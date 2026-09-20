import { supabase } from '@/lib/supabase';
import { Article, Video, Category, AiTool } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedArticle from '@/components/home/FeaturedArticle';
import TrendingGrid from '@/components/home/TrendingGrid';
import TrendingThisWeek from '@/components/home/TrendingThisWeek';
import FeaturedVideo from '@/components/home/FeaturedVideo';
import PopularCategories from '@/components/home/PopularCategories';
import NewsletterSection from '@/components/home/NewsletterSection';
import NewsTicker from '@/components/home/NewsTicker';
import ToolOfTheWeek from '@/components/home/ToolOfTheWeek';
import ToolsSpotlight from '@/components/home/ToolsSpotlight';
import GlossarySpotlight from '@/components/home/GlossarySpotlight';
import FounderSection from '@/components/home/FounderSection';
import JoinCommunitySection from '@/components/home/JoinCommunitySection';
import LearnSection from '@/components/home/LearnSection';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Decoding Tomorrow With Attharva — AI, Business & Technology',
  description:
    'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply. Think School meets TechCrunch.',
  openGraph: {
    title: 'Decoding Tomorrow With Attharva — AI, Business & Technology',
    description:
      'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
    type: 'website',
    url: 'https://decodingtomorrowwithattharva.netlify.app',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Decoding Tomorrow With Attharva',
  url: 'https://decodingtomorrowwithattharva.netlify.app',
  description:
    'Deep dives on AI tools, companies, and the trends shaping tomorrow — explained simply.',
  author: {
    '@type': 'Person',
    name: 'Attharva',
    url: 'https://decodingtomorrowwithattharva.netlify.app/about',
  },
  sameAs: ['https://www.youtube.com/@DecodingTomorrowWithAttharva'],
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://decodingtomorrowwithattharva.netlify.app/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
};

async function getData() {
  const [articlesRes, videosRes, categoriesRes, toolRes, toolsRes, glossaryRes] = await Promise.all([
    supabase
      .from('articles')
      .select('*, categories(name, slug, color)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(8),
    supabase
      .from('videos')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('categories')
      .select('*')
      .order('article_count', { ascending: false })
      .limit(6),
    supabase
      .from('ai_tools')
      .select('*')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ai_tools')
      .select('*')
      .order('rating', { ascending: false })
      .limit(6),
    supabase
      .from('glossary_terms')
      .select('id, term, slug, simple_explanation, category')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(6),
  ]);

  return {
    articles: (articlesRes.data || []) as Article[],
    videos: (videosRes.data || []) as Video[],
    categories: (categoriesRes.data || []) as Category[],
    featuredTool: toolRes.data as AiTool | null,
    tools: (toolsRes.data || []) as AiTool[],
    glossaryTerms: glossaryRes.data || [],
  };
}

export default async function HomePage() {
  const { articles, videos, categories, featuredTool, tools, glossaryTerms } = await getData();
  const featuredArticle = articles[0] || null;
  const trendingArticles = articles.slice(1, 7);
  const featuredVideo = videos.find((v) => v.is_featured) || videos[0] || null;

  return (
    <div className="min-h-screen bg-brand-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <HeroSection />
        {articles.length > 0 && <NewsTicker articles={articles.slice(0, 5)} />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
          {featuredArticle && <FeaturedArticle article={featuredArticle} />}
          {trendingArticles.length > 0 && <TrendingThisWeek articles={trendingArticles} />}
          {trendingArticles.length > 0 && <TrendingGrid articles={trendingArticles} />}
          {glossaryTerms.length > 0 && <GlossarySpotlight terms={glossaryTerms} />}
          {featuredTool && <ToolOfTheWeek tool={featuredTool} />}
          {tools.length > 0 && <ToolsSpotlight tools={tools} />}
          {featuredVideo && <FeaturedVideo video={featuredVideo} />}
          <LearnSection />
          {categories.length > 0 && <PopularCategories categories={categories} />}
          <FounderSection />
          <JoinCommunitySection />
          <NewsletterSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
