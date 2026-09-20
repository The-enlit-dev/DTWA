import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Article, Category } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'In-depth analysis on AI tools, companies, and business strategy — explained simply by Attharva.',
  openGraph: {
    title: 'The AI & Tech Blog | Decoding Tomorrow With Attharva',
    description:
      'In-depth analysis on AI tools, companies, and business strategy — explained simply.',
    type: 'website',
  },
  alternates: {
    canonical: 'https://decodingtomorrowwithattharva.netlify.app/blog',
  },
};

export const dynamic = 'force-dynamic';

async function getData() {
  const [articlesRes, categoriesRes] = await Promise.all([
    supabase
      .from('articles')
      .select('*, categories(name, slug, color)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    supabase.from('categories').select('*').order('article_count', { ascending: false }),
  ]);

  return {
    articles: (articlesRes.data || []) as Article[],
    categories: (categoriesRes.data || []) as Category[],
  };
}

export default async function BlogPage() {
  const { articles, categories } = await getData();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="font-display font-bold text-4xl text-white mb-3">
                The AI & Tech Blog
              </h1>
              <p className="text-gray-400 text-lg">
                In-depth analysis on AI tools, companies, and business strategy — explained simply.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <BlogClient articles={articles} categories={categories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
