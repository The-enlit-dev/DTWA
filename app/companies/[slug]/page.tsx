import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Company, Article } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import RelatedArticles from '@/app/blog/[slug]/RelatedArticles';
import { ExternalLink, MapPin, Users, DollarSign, Building2, ArrowLeft, Calendar, Briefcase, Trophy, TrendingUp, Boxes, Crown } from 'lucide-react';

interface Props { params: { slug: string } }

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

async function getCompany(slug: string) {
  const { data } = await supabase.from('companies').select('*').eq('slug', slug).maybeSingle();
  return data as Company | null;
}

async function getRelatedArticles(company: Company) {
  const tags = company.tags?.length ? company.tags : [company.name.toLowerCase()];
  const { data } = await supabase
    .from('articles')
    .select('*, categories(name, slug, color)')
    .eq('status', 'published')
    .or(tags.map((t) => `tags.cs.{${t}}`).join(','))
    .order('view_count', { ascending: false })
    .limit(3);
  return (data || []) as Article[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = await getCompany(params.slug);
  if (!company) return { title: 'Company Not Found' };
  const title = `${company.name} — Founders, Funding, CEO & Products`;
  const description = company.short_description || `Profile of ${company.name}: founders, CEO, funding, products, competitors, and the latest developments.`;
  const canonical = `${SITE_URL}/companies/${company.slug}`;
  return {
    title,
    description,
    keywords: [company.name, ...company.tags, 'ai company', 'company profile', 'funding', 'founders'],
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [{ url: company.logo_url || `${SITE_URL}/my_good_picture_for_pfp.png`, alt: company.name }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical },
  };
}

export default async function CompanyDetailPage({ params }: Props) {
  const company = await getCompany(params.slug);
  if (!company) notFound();

  const related = await getRelatedArticles(company);
  const canonical = `${SITE_URL}/companies/${company.slug}`;

  const metrics = [
    { label: 'Total Funding', value: company.total_funding, icon: DollarSign },
    { label: 'Valuation', value: company.valuation, icon: DollarSign },
    { label: 'Revenue (est.)', value: company.revenue_estimate, icon: DollarSign },
    { label: 'Employees', value: company.employees_count, icon: Users },
    { label: 'Founded', value: company.founded_year ? String(company.founded_year) : '', icon: Calendar },
    { label: 'Headquarters', value: company.headquarters, icon: MapPin },
  ].filter((m) => m.value);

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.short_description || company.description,
    url: company.website_url || canonical,
    logo: company.logo_url ? { '@type': 'ImageObject', url: company.logo_url } : undefined,
    foundingDate: company.founded_year ? String(company.founded_year) : undefined,
    founder: (company.founders || []).map((f) => ({ '@type': 'Person', name: f })),
    employeeCount: company.employees_count || undefined,
    address: company.headquarters ? { '@type': 'PostalAddress', addressLocality: company.headquarters } : undefined,
    sameAs: company.website_url ? [company.website_url] : [],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Companies', item: `${SITE_URL}/companies` },
      { '@type': 'ListItem', position: 3, name: company.name, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/companies" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Companies
          </Link>

          {/* Header */}
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-5 flex-col sm:flex-row">
              <div className="w-16 h-16 rounded-xl bg-brand-700 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-brand-blue" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="font-display font-bold text-3xl text-white">{company.name}</h1>
                  {company.funding_stage && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/30 text-purple-400">
                      {company.funding_stage}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 leading-relaxed">{company.short_description}</p>
              </div>
              {company.website_url && (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 glass border border-white/10 hover:border-brand-blue/30 text-white font-medium rounded-xl text-sm shrink-0 transition-colors"
                >
                  Visit <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Metrics grid */}
          {metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {metrics.map((m) => (
                <div key={m.label} className="glass rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                    <m.icon className="w-3 h-3" /> {m.label}
                  </div>
                  <div className="font-semibold text-white">{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Two-column: About + Key Facts */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-6">
            {/* About */}
            <div className="glass rounded-xl p-6">
              <h2 className="font-display font-bold text-xl text-white mb-4">About {company.name}</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">{company.description}</p>
              {company.business_model && (
                <div className="mt-6 pt-6 border-t border-white/8">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-blue" /> Business Model
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{company.business_model}</p>
                </div>
              )}
            </div>

            {/* Key facts sidebar */}
            <aside className="space-y-4">
              {company.ceo && (
                <div className="glass rounded-xl p-5">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> CEO
                  </div>
                  <div className="font-semibold text-white">{company.ceo}</div>
                </div>
              )}
              {company.founders?.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-blue" /> Founders
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.founders.map((founder) => (
                      <div key={founder} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-brand-blue font-bold text-xs">
                          {founder.charAt(0)}
                        </div>
                        <span className="text-sm text-white">{founder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {company.products?.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-brand-blue" /> Key Products
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.products.map((product) => (
                      <span key={product} className="px-2.5 py-1 bg-brand-blue/15 border border-brand-blue/30 text-brand-blue text-xs rounded-lg">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* Competitors + Latest developments */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {company.competitors?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-blue" /> Competitors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.competitors.map((comp) => {
                    const slug = comp.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    return (
                      <Link
                        key={comp}
                        href={`/companies/${slug}`}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/8 text-sm text-gray-300 rounded-lg transition-colors"
                      >
                        {comp}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {company.latest_developments?.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-blue" /> Latest Developments
                </h3>
                <ul className="space-y-3">
                  {company.latest_developments.map((dev, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                      {dev}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tags */}
          {company.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {company.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${tag}`} className="text-sm text-gray-400 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Related articles */}
          {related.length > 0 && (
            <div className="border-t border-white/8 pt-10">
              <RelatedArticles articles={related} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
