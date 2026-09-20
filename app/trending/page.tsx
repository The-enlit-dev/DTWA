import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TrendingClient from './TrendingClient';

export const metadata: Metadata = {
  title: 'Trending',
  description: 'The most popular AI articles, tools, and companies right now.',
};

export const revalidate = 30;

async function getData() {
  const [articlesRes, toolsRes, companiesRes] = await Promise.all([
    supabase
      .from('articles')
      .select('*, categories(name, slug, color)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10),
    supabase
      .from('ai_tools')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(8),
    supabase
      .from('companies')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(6),
  ]);

  return {
    articles: articlesRes.data || [],
    tools: toolsRes.data || [],
    companies: companiesRes.data || [],
  };
}

export default async function TrendingPage() {
  const data = await getData();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display font-bold text-4xl text-white mb-3">Trending Now</h1>
            <p className="text-gray-400 text-lg">The most popular articles, tools, and companies across the platform.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <TrendingClient data={data} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
