import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { AiTool } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ToolsClient from './ToolsClient';

export const metadata: Metadata = {
  title: 'AI Tools Directory',
  description:
    'Discover and compare the best AI tools. Honest reviews, ratings, and side-by-side comparisons.',
  openGraph: {
    title: 'AI Tools Directory | Decoding Tomorrow With Attharva',
    description: 'Discover and compare the best AI tools. Honest reviews, ratings, and side-by-side comparisons.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/tools' },
};

export const dynamic = 'force-dynamic';

async function getTools() {
  const { data } = await supabase
    .from('ai_tools')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(100);
  return (data || []) as AiTool[];
}

export default async function ToolsPage() {
  const tools = await getTools();
  const categories = Array.from(new Set(tools.map((t) => t.category))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center">
                <span className="text-2xl">🛠</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-4xl text-white">AI Tools Directory</h1>
                <p className="text-gray-400">
                  {tools.length} tools reviewed and rated
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl">
              Find the perfect AI tools for your workflow. Honest reviews, ratings, and side-by-side comparisons.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ToolsClient tools={tools} categories={categories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
