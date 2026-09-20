import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SearchResults from './SearchResults';

interface Props {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: Props): Metadata {
  return {
    title: searchParams.q ? `Search: "${searchParams.q}"` : 'Search',
    description: 'Search across articles, AI tools, glossary terms, companies, and comparisons.',
  };
}

async function search(query: string) {
  if (!query.trim()) return { articles: [], tools: [], companies: [], glossary: [], comparisons: [] };

  const q = `%${query}%`;
  const [articlesRes, toolsRes, companiesRes, glossaryRes, comparisonsRes] = await Promise.all([
    supabase
      .from('articles')
      .select('*, categories(name, slug, color)')
      .eq('status', 'published')
      .or(`title.ilike.${q},excerpt.ilike.${q},tags.cs.{${query}}`)
      .limit(10),
    supabase
      .from('ai_tools')
      .select('*')
      .or(`name.ilike.${q},short_description.ilike.${q},category.ilike.${q}`)
      .limit(8),
    supabase
      .from('companies')
      .select('*')
      .or(`name.ilike.${q},short_description.ilike.${q}`)
      .limit(6),
    supabase
      .from('glossary_terms')
      .select('id, term, slug, simple_explanation, category')
      .eq('status', 'published')
      .or(`term.ilike.${q},simple_explanation.ilike.${q}`)
      .limit(8),
    supabase
      .from('tool_comparisons')
      .select('id, slug, title, tool_a_name, tool_b_name')
      .eq('status', 'published')
      .or(`title.ilike.${q},tool_a_name.ilike.${q},tool_b_name.ilike.${q}`)
      .limit(6),
  ]);

  return {
    articles: articlesRes.data || [],
    tools: toolsRes.data || [],
    companies: companiesRes.data || [],
    glossary: glossaryRes.data || [],
    comparisons: comparisonsRes.data || [],
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  const results = await search(query);
  const totalResults = results.articles.length + results.tools.length + results.companies.length + results.glossary.length + results.comparisons.length;

  // Track search query (anonymous)
  if (query.trim()) {
    supabase.from('search_queries').insert({ query: query.trim(), result_count: totalResults }).then(() => {});
  }

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {query ? (
              <>
                <p className="text-sm text-gray-500 mb-1">{totalResults} results for</p>
                <h1 className="font-display font-bold text-3xl text-white">&ldquo;{query}&rdquo;</h1>
              </>
            ) : (
              <>
                <h1 className="font-display font-bold text-3xl text-white">Search</h1>
                <p className="text-gray-500 text-sm mt-2">Find articles, AI tools, glossary terms, companies, and comparisons.</p>
              </>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <SearchResults results={results} query={query} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
