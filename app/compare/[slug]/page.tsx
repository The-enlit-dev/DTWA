import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ToolComparison } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Scale, Check, X, Trophy, ThumbsUp, ThumbsDown, Sparkles, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props { params: { slug: string } }

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

async function getComparison(slug: string) {
  const { data } = await supabase.from('tool_comparisons').select('*').eq('slug', slug).maybeSingle();
  return data as ToolComparison | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getComparison(params.slug);
  if (!c) return { title: 'Comparison Not Found' };
  const title = c.title;
  const description = c.summary;
  const canonical = `${SITE_URL}/compare/${c.slug}`;
  return {
    title,
    description,
    keywords: [c.tool_a, c.tool_b, 'comparison', ...c.tags],
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical },
  };
}

export default async function ComparisonDetailPage({ params }: Props) {
  const c = await getComparison(params.slug);
  if (!c) notFound();

  const canonical = `${SITE_URL}/compare/${c.slug}`;
  const timeAgo = c.published_at ? formatDistanceToNow(new Date(c.published_at), { addSuffix: true }) : '';
  const winnerName = c.winner === 'tool_a' ? c.tool_a : c.winner === 'tool_b' ? c.tool_b : "It's a tie";

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: c.title,
    description: c.summary,
    datePublished: c.published_at,
    dateModified: c.updated_at,
    author: { '@type': 'Organization', name: 'Decoding Tomorrow With Attharva', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Decoding Tomorrow With Attharva',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/my_good_picture_for_pfp.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` },
      { '@type': 'ListItem', position: 3, name: c.title, item: canonical },
    ],
  };

  const prosA = c.pros_cons?.tool_a?.pros || [];
  const consA = c.pros_cons?.tool_a?.cons || [];
  const prosB = c.pros_cons?.tool_b?.pros || [];
  const consB = c.pros_cons?.tool_b?.cons || [];
  const pricingA = c.pricing?.tool_a;
  const pricingB = c.pricing?.tool_b;
  const useA = c.use_cases?.tool_a || [];
  const useB = c.use_cases?.tool_b || [];

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/compare" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Comparisons
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-brand-blue" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue">Comparison</span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight mb-4 max-w-3xl mx-auto">{c.title}</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">{c.summary}</p>
            <p className="text-xs text-gray-500 mt-4">{timeAgo}</p>
          </div>

          {/* VS header */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <ToolBadge name={c.tool_a} slug={c.tool_a_slug} highlighted={c.winner === 'tool_a'} />
            <span className="font-display font-black text-2xl text-gray-600">VS</span>
            <ToolBadge name={c.tool_b} slug={c.tool_b_slug} highlighted={c.winner === 'tool_b'} />
          </div>

          {/* Feature comparison table */}
          {c.features?.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display font-bold text-2xl text-white mb-6">Feature Comparison</h2>
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/8">
                        <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-5 py-4">Feature</th>
                        <th className="text-left text-sm font-semibold text-white px-5 py-4">{c.tool_a}</th>
                        <th className="text-left text-sm font-semibold text-white px-5 py-4">{c.tool_b}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.features.map((f, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                          <td className="px-5 py-3.5 text-sm text-gray-400 font-medium">{f.feature}</td>
                          <td className="px-5 py-3.5 text-sm text-white">{f.tool_a_value}</td>
                          <td className="px-5 py-3.5 text-sm text-white">{f.tool_b_value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Pros & cons */}
          <section className="mb-12">
            <h2 className="font-display font-bold text-2xl text-white mb-6">Pros &amp; Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <ProsConsCard name={c.tool_a} pros={prosA} cons={consA} highlighted={c.winner === 'tool_a'} />
              <ProsConsCard name={c.tool_b} pros={prosB} cons={consB} highlighted={c.winner === 'tool_b'} />
            </div>
          </section>

          {/* Pricing */}
          {(pricingA || pricingB) && (
            <section className="mb-12">
              <h2 className="font-display font-bold text-2xl text-white mb-6">Pricing</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {pricingA && <PricingCard name={c.tool_a} data={pricingA} highlighted={c.winner === 'tool_a'} />}
                {pricingB && <PricingCard name={c.tool_b} data={pricingB} highlighted={c.winner === 'tool_b'} />}
              </div>
            </section>
          )}

          {/* Use cases */}
          {(useA.length > 0 || useB.length > 0) && (
            <section className="mb-12">
              <h2 className="font-display font-bold text-2xl text-white mb-6">Best Use Cases</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {useA.length > 0 && <UseCaseCard name={c.tool_a} cases={useA} highlighted={c.winner === 'tool_a'} />}
                {useB.length > 0 && <UseCaseCard name={c.tool_b} cases={useB} highlighted={c.winner === 'tool_b'} />}
              </div>
            </section>
          )}

          {/* Overall recommendation */}
          {c.recommendation && (
            <section className="mb-12">
              <div className="glass rounded-2xl p-8 border border-brand-blue/20">
                <h2 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-blue" /> Overall Recommendation
                </h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue/15 border border-brand-blue/30 mb-4">
                  <Trophy className="w-4 h-4 text-brand-blue" />
                  <span className="font-semibold text-white">Winner: {winnerName}</span>
                </div>
                <p className="text-gray-400 leading-relaxed">{c.recommendation}</p>
              </div>
            </section>
          )}

          {/* Tags */}
          {c.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {c.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${tag}`} className="text-sm text-gray-400 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ToolBadge({ name, slug, highlighted }: { name: string; slug?: string; highlighted?: boolean }) {
  const cls = `font-display font-bold text-xl px-6 py-3 rounded-xl border transition-colors ${
    highlighted ? 'bg-brand-blue/15 border-brand-blue/40 text-white' : 'bg-brand-700/60 border-white/8 text-gray-300'
  }`;
  if (slug) {
    return (
      <Link href={`/tools/${slug}`} className={cls + ' hover:border-brand-blue/40'}>
        {name}
      </Link>
    );
  }
  return <span className={cls}>{name}</span>;
}

function ProsConsCard({ name, pros, cons, highlighted }: { name: string; pros: string[]; cons: string[]; highlighted?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-6 ${highlighted ? 'border-brand-blue/30' : ''}`}>
      <h3 className="font-display font-bold text-lg text-white mb-5">{name}</h3>
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Pros</h4>
          <ul className="space-y-2">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
                <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-1.5"><ThumbsDown className="w-4 h-4" /> Cons</h4>
          <ul className="space-y-2">
            {cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
                <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, data, highlighted }: { name: string; data: { plan: string; price: string; details: string }; highlighted?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-6 ${highlighted ? 'border-brand-blue/30' : ''}`}>
      <h3 className="font-display font-bold text-lg text-white mb-1">{name}</h3>
      <p className="text-xs text-gray-500 mb-4">{data.plan}</p>
      <div className="font-display font-bold text-3xl text-white mb-3">{data.price}</div>
      <p className="text-sm text-gray-400 leading-relaxed">{data.details}</p>
    </div>
  );
}

function UseCaseCard({ name, cases, highlighted }: { name: string; cases: string[]; highlighted?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-6 ${highlighted ? 'border-brand-blue/30' : ''}`}>
      <h3 className="font-display font-bold text-lg text-white mb-4">Best for {name}</h3>
      <ul className="space-y-2.5">
        {cases.map((uc, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
            <ArrowRight className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" /> {uc}
          </li>
        ))}
      </ul>
    </div>
  );
}
