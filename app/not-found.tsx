import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, FileText, Cpu, BookOpen, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const revalidate = 3600;

async function getPopularContent() {
  const [articlesRes, toolsRes, glossaryRes] = await Promise.all([
    supabase.from('articles').select('title, slug').eq('status', 'published').order('view_count', { ascending: false }).limit(4),
    supabase.from('ai_tools').select('name, slug').order('rating', { ascending: false }).limit(4),
    supabase.from('glossary_terms').select('term, slug').eq('status', 'published').order('view_count', { ascending: false }).limit(4),
  ]);
  return {
    articles: articlesRes.data || [],
    tools: toolsRes.data || [],
    glossary: glossaryRes.data || [],
  };
}

export default async function NotFound() {
  const { articles, tools, glossary } = await getPopularContent();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="flex items-center justify-center min-h-[80vh] px-4 py-20">
        <div className="text-center max-w-2xl w-full">
          <div className="relative mb-8">
            <div className="text-[120px] font-display font-black gradient-text leading-none opacity-30">
              404
            </div>
            <Image
              src="/my_good_picture_for_pfp.png"
              alt="Decoding Tomorrow"
              width={80}
              height={80}
              className="rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-3">Looks like this page went missing</h1>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>

          {/* Search + Home */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/" className="btn-gradient flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl text-sm">
              <ArrowLeft className="w-4 h-4" /> Go Home
            </Link>
            <Link href="/search" className="flex items-center gap-2 px-6 py-3 glass border border-white/10 text-gray-300 font-medium rounded-xl text-sm hover:border-white/20">
              <Search className="w-4 h-4" /> Search Content
            </Link>
          </div>

          {/* Popular content suggestions */}
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {articles.length > 0 && (
              <div className="glass rounded-xl p-4 border border-white/8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Popular Articles
                </h3>
                <div className="space-y-2">
                  {articles.map((a: any) => (
                    <Link key={a.slug} href={`/blog/${a.slug}`} className="block text-sm text-gray-400 hover:text-white transition-colors line-clamp-1">
                      {a.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {tools.length > 0 && (
              <div className="glass rounded-xl p-4 border border-white/8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Popular Tools
                </h3>
                <div className="space-y-2">
                  {tools.map((t: any) => (
                    <Link key={t.slug} href={`/tools/${t.slug}`} className="block text-sm text-gray-400 hover:text-white transition-colors line-clamp-1">
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {glossary.length > 0 && (
              <div className="glass rounded-xl p-4 border border-white/8">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Glossary Terms
                </h3>
                <div className="space-y-2">
                  {glossary.map((g: any) => (
                    <Link key={g.slug} href={`/glossary/${g.slug}`} className="block text-sm text-gray-400 hover:text-white transition-colors line-clamp-1">
                      {g.term}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
