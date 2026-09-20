import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AiTool } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Star, ExternalLink, Check, AlertCircle, Cpu, ArrowLeft } from 'lucide-react';

interface Props { params: { slug: string } }

export const revalidate = 60;

async function getTool(slug: string) {
  const { data } = await supabase.from('ai_tools').select('*').eq('slug', slug).maybeSingle();
  return data as AiTool | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getTool(params.slug);
  if (!tool) return { title: 'Tool Not Found' };
  return { title: `${tool.name} Review`, description: tool.short_description };
}

const pricingColors: Record<string, string> = {
  free: 'text-green-400 bg-green-400/10 border-green-400/20',
  freemium: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  paid: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  open_source: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export default async function ToolDetailPage({ params }: Props) {
  const tool = await getTool(params.slug);
  if (!tool) notFound();

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to AI Tools
          </Link>

          {/* Header */}
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-xl bg-brand-700 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {tool.logo_url ? (
                  <img src={tool.logo_url} alt={tool.name} className="w-full h-full object-cover" />
                ) : (
                  <Cpu className="w-8 h-8 text-brand-blue" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="font-display font-bold text-3xl text-white">{tool.name}</h1>
                  <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${pricingColors[tool.pricing_model] || ''}`}>
                    {tool.pricing_model.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400">{tool.category}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.round(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                  ))}
                  <span className="font-bold text-white">{tool.rating.toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">/ 5.0</span>
                </div>
                <p className="text-gray-400 leading-relaxed">{tool.short_description}</p>
              </div>
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient flex items-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl text-sm shrink-0"
              >
                Visit Tool <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="glass rounded-xl p-6 mb-6">
            <h2 className="font-display font-bold text-xl text-white mb-4">Overview</h2>
            <p className="text-gray-400 leading-relaxed">{tool.description}</p>
          </div>

          {/* Pros & Cons */}
          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
                <Check className="w-4 h-4" /> What We Love
              </h3>
              <ul className="space-y-3">
                {tool.pros.map((pro) => (
                  <li key={pro} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-green-400" />
                    </span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Watch Out For
              </h3>
              <ul className="space-y-3">
                {tool.cons.map((con) => (
                  <li key={con} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    </span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tags */}
          {tool.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span key={tag} className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
