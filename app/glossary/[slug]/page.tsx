import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { GlossaryTerm } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { BookOpen, Tag, ChevronRight, ArrowLeft, FileText, Lightbulb } from 'lucide-react';

interface Props { params: { slug: string } }

export const revalidate = 3600;

async function getTerm(slug: string): Promise<GlossaryTerm | null> {
  const { data } = await supabase
    .from('glossary_terms')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

async function getRelatedTerms(slugs: string[]): Promise<GlossaryTerm[]> {
  if (!slugs.length) return [];
  const { data } = await supabase
    .from('glossary_terms')
    .select('id, term, slug, simple_explanation, category')
    .in('slug', slugs)
    .eq('status', 'published');
  return (data || []) as GlossaryTerm[];
}

async function getRelatedArticles(termName: string, tags: string[]) {
  const { data } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, featured_image, published_at, read_time')
    .eq('status', 'published')
    .or(`tags.cs.{${tags.join(',')}},title.ilike.%${termName.split('(')[0].trim()}%`)
    .limit(3);
  return data || [];
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('glossary_terms')
    .select('slug')
    .eq('status', 'published');
  return (data || []).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const term = await getTerm(params.slug);
  if (!term) return { title: 'Term Not Found' };

  const baseUrl = 'https://decodingtomorrowwithattharva.netlify.app';
  const canonical = term.canonical_url || `${baseUrl}/glossary/${term.slug}`;
  const title = term.seo_title || `${term.term} Explained | AI Glossary`;
  const description = term.meta_description || term.simple_explanation.slice(0, 160);

  return {
    title,
    description,
    keywords: [term.primary_keyword, ...term.secondary_keywords].filter(Boolean),
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'Decoding Tomorrow With Attharva',
      images: term.og_image ? [{ url: term.og_image, alt: term.term }] : [],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical },
  };
}

const whyItMatters: Record<string, string> = {
  'Foundations': 'Understanding foundational AI concepts helps you cut through hype, ask sharper questions, and evaluate tools with confidence — no engineering degree required.',
  'Models': 'Knowing the differences between model types helps you choose the right tool for any task, understand capability limits, and avoid expensive mistakes.',
  'Architecture': 'Understanding how AI systems are built internally helps engineers design better pipelines and helps everyone grasp why models behave the way they do.',
  'Training': 'Training knowledge is the key to deciding when to fine-tune, when to use RAG, and when simple prompting is enough — saving time and money.',
  'Usage': 'Usage patterns directly affect the quality and cost of every AI interaction. Mastering them is the fastest way to get dramatically better results.',
  'Infrastructure': 'AI infrastructure decisions determine speed, cost, and reliability at scale. Understanding them helps teams avoid bottlenecks before they become crises.',
  'Capabilities': 'Knowing what AI can actually do — versus what it\'s marketed to do — lets you set realistic expectations and build products people trust.',
  'Limitations': 'Understanding AI limitations is just as important as understanding capabilities. It\'s what separates responsible builders from ones who ship problems.',
  'Parameters': 'Model parameters control everything from creativity to consistency. Tuning them correctly is the difference between a generic output and a great one.',
  'Ethics & Safety': 'AI ethics and safety shape who benefits from these systems and who is harmed. Every practitioner has a responsibility to understand these stakes.',
  'Ecosystem': 'The AI ecosystem moves fast. Understanding its structure helps you spot which tools and companies matter and which are noise.',
  'Applications': 'Real-world AI applications show you what\'s proven and what\'s still experimental — essential knowledge before committing budget or time.',
  'Research': 'AI research today becomes production tomorrow. Staying current on research trends gives you a head start on what\'s coming next.',
  'Evaluation': 'You can\'t improve what you can\'t measure. Evaluation methods are the foundation of building AI systems that actually work reliably.',
};

const categoryColors: Record<string, string> = {
  'Foundations': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Models': 'text-green-400 bg-green-400/10 border-green-400/20',
  'Architecture': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Training': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Usage': 'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
  'Infrastructure': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  'Capabilities': 'text-teal-400 bg-teal-400/10 border-teal-400/20',
  'Limitations': 'text-red-400 bg-red-400/10 border-red-400/20',
  'Parameters': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Ethics & Safety': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  'Ecosystem': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  'Applications': 'text-lime-400 bg-lime-400/10 border-lime-400/20',
  'Research': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  'Evaluation': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
};

export default async function GlossaryTermPage({ params }: Props) {
  const term = await getTerm(params.slug);
  if (!term) notFound();

  const [relatedTerms, relatedArticles] = await Promise.all([
    getRelatedTerms(term.related_term_slugs || []),
    getRelatedArticles(term.term, term.tags),
  ]);

  const baseUrl = 'https://decodingtomorrowwithattharva.netlify.app';
  const canonical = term.canonical_url || `${baseUrl}/glossary/${term.slug}`;
  const catColor = categoryColors[term.category] || 'text-gray-400 bg-white/5 border-white/10';

  // JSON-LD schemas
  const definedTermSchema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.simple_explanation,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'AI Glossary — Decoding Tomorrow',
      url: `${baseUrl}/glossary`,
    },
    url: canonical,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'AI Glossary', item: `${baseUrl}/glossary` },
      { '@type': 'ListItem', position: 3, name: term.term, item: canonical },
    ],
  };

  const faqSchema = term.faq?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: term.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <Navbar />

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/glossary" className="hover:text-white transition-colors">AI Glossary</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-300">{term.term}</span>
          </nav>

          {/* Hero */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
                <Tag className="w-3 h-3" /> {term.category}
              </span>
              {term.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-6">
              {term.term}
            </h1>

            {/* Quick definition */}
            <div className="glass rounded-2xl p-6 border border-brand-blue/20 bg-brand-blue/5">
              <div className="flex items-center gap-2 text-brand-blue text-xs font-semibold mb-3 uppercase tracking-wide">
                <BookOpen className="w-3.5 h-3.5" /> Definition
              </div>
              <p className="text-white text-lg leading-relaxed">{term.simple_explanation}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Why It Matters */}
              {whyItMatters[term.category] && (
                <section className="glass rounded-2xl p-6 border border-teal-500/20 bg-teal-500/5">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold mb-3 uppercase tracking-wide">
                    <Lightbulb className="w-3.5 h-3.5" /> Why It Matters
                  </div>
                  <p className="text-gray-200 leading-relaxed">{whyItMatters[term.category]}</p>
                </section>
              )}

              {/* Detailed explanation */}
              {term.detailed_explanation && (
                <section>
                  <h2 className="font-display font-bold text-xl text-white mb-4">In Depth</h2>
                  <div className="prose-brand text-gray-300 leading-relaxed space-y-4">
                    {term.detailed_explanation.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Example */}
              {term.example && (
                <section>
                  <h2 className="font-display font-bold text-xl text-white mb-4">Real-World Example</h2>
                  <div className="glass rounded-xl p-5 border-l-4 border-brand-blue bg-brand-blue/5">
                    <p className="text-gray-300 text-sm leading-relaxed italic">"{term.example}"</p>
                  </div>
                </section>
              )}

              {/* FAQ */}
              {term.faq?.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-xl text-white mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {term.faq.map((item, i) => (
                      <div key={i} className="glass rounded-xl p-5 border border-white/8">
                        <h3 className="font-semibold text-white text-sm mb-2">{item.question}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-blue" /> Related Articles
                  </h2>
                  <div className="space-y-3">
                    {relatedArticles.map((article: any) => (
                      <Link
                        key={article.id}
                        href={`/blog/${article.slug}`}
                        className="flex items-start gap-4 glass rounded-xl p-4 border border-white/8 hover:border-brand-blue/30 transition-colors group"
                      >
                        {article.featured_image && (
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <h3 className="text-sm font-semibold text-white group-hover:text-brand-blue transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.excerpt}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick facts */}
              <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Facts</p>
                </div>
                <div className="divide-y divide-white/6">
                  <div className="px-4 py-3">
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="text-sm text-white font-medium mt-0.5">{term.category}</p>
                  </div>
                  {term.primary_keyword && (
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-500">Also known as</p>
                      <p className="text-sm text-white font-medium mt-0.5">{term.primary_keyword}</p>
                    </div>
                  )}
                  {term.tags.length > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-500 mb-2">Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {term.tags.map((tag) => (
                          <span key={tag} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Terms */}
              {relatedTerms.length > 0 && (
                <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Related Terms</p>
                  </div>
                  <div className="divide-y divide-white/6">
                    {relatedTerms.map((rt) => (
                      <Link
                        key={rt.slug}
                        href={`/glossary/${rt.slug}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-brand-blue transition-colors truncate">
                            {rt.term}
                          </p>
                          <p className="text-xs text-gray-500">{rt.category}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-brand-blue transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse Glossary */}
              <div className="glass rounded-2xl border border-white/8 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Browse More Terms</p>
                <Link
                  href="/glossary"
                  className="flex items-center gap-2 text-sm text-brand-blue hover:text-blue-300 transition-colors"
                >
                  <BookOpen className="w-4 h-4" /> View full AI Glossary
                </Link>
              </div>
            </div>
          </div>

          {/* Back navigation */}
          <div className="mt-12 pt-8 border-t border-white/8 flex items-center justify-between">
            <Link
              href="/glossary"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Glossary
            </Link>
            <p className="text-xs text-gray-600">
              Last updated: {new Date(term.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
