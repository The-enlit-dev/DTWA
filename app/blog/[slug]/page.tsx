import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ArticleContent from './ArticleContent';
import RelatedArticles from './RelatedArticles';
import ShareButtons from './ShareButtons';
import BookmarkButton from './BookmarkButton';
import TableOfContents from './TableOfContents';
import { Clock, Eye, Heart, Calendar, ArrowLeft, Tag, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  params: { slug: string };
}

export const revalidate = 60;

async function getArticle(slug: string) {
  const { data } = await supabase
    .from('articles')
    .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url, bio)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data as Article | null;
}

async function getRelated(articleId: string, categoryId: string) {
  const { data } = await supabase
    .from('articles')
    .select('*, categories(name, slug, color)')
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .neq('id', articleId)
    .order('view_count', { ascending: false })
    .limit(3);
  return (data || []) as Article[];
}

function renderContent(raw: string): string {
  return raw
    .split('\n')
    .map((line) => {
      if (line.startsWith('### ')) {
        const text = line.replace(/^###\s+/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h3 id="${id}">${text}</h3>`;
      }
      if (line.startsWith('## ')) {
        const text = line.replace(/^##\s+/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `<h2 id="${id}">${text}</h2>`;
      }
      if (line.startsWith('# ')) {
        return `<h2>${line.replace(/^#\s+/, '')}</h2>`;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return `<strong>${line.slice(2, -2)}</strong>`;
      }
      if (line.trim() === '') return '<br/>';
      return line;
    })
    .join('\n');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Article Not Found' };
  const title = article.seo_title || article.title;
  const description = article.meta_description || article.excerpt;
  const canonical = article.canonical_url || `https://decodingtomorrowwithattharva.netlify.app/blog/${article.slug}`;
  return {
    title,
    description,
    keywords: article.primary_keyword
      ? [article.primary_keyword, ...(article.secondary_keywords || [])]
      : article.tags,
    authors: [{ name: (article.profiles as any)?.full_name || 'Attharva' }],
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [(article.profiles as any)?.full_name || 'Attharva'],
      images: [{ url: article.featured_image || 'https://decodingtomorrowwithattharva.netlify.app/my_good_picture_for_pfp.png', alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [article.featured_image || 'https://decodingtomorrowwithattharva.netlify.app/my_good_picture_for_pfp.png'] },
    alternates: { canonical },
  };
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const category = article.categories as any;
  const author = article.profiles as any;
  const related = article.category_id ? await getRelated(article.id, article.category_id) : [];

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : '';

  const canonicalUrl = article.canonical_url || `https://decodingtomorrowwithattharva.netlify.app/blog/${article.slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.seo_title || article.title,
    description: article.meta_description || article.excerpt,
    image: article.featured_image || 'https://decodingtomorrowwithattharva.netlify.app/my_good_picture_for_pfp.png',
    datePublished: article.published_at,
    dateModified: article.updated_at,
    keywords: article.primary_keyword || (article.tags || []).join(', '),
    author: {
      '@type': 'Person',
      name: author?.full_name || author?.username || 'Attharva',
      url: 'https://decodingtomorrowwithattharva.netlify.app/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Decoding Tomorrow With Attharva',
      url: 'https://decodingtomorrowwithattharva.netlify.app',
      logo: { '@type': 'ImageObject', url: 'https://decodingtomorrowwithattharva.netlify.app/my_good_picture_for_pfp.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    url: canonicalUrl,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://decodingtomorrowwithattharva.netlify.app' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://decodingtomorrowwithattharva.netlify.app/blog' },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl },
    ],
  };

  const renderedContent = renderContent(article.content || '');

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />
      <main className="pt-20">
        <ArticleContent article={article} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link href={`/blog?category=${category.slug}`} className="hover:text-white transition-colors">{category.name}</Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-gray-300 truncate max-w-[200px]">{article.title}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_280px] gap-10 items-start">

            {/* Main content column */}
            <article className="max-w-3xl">
              {/* Back */}
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Blog
              </Link>

              {/* Category */}
              {category && (
                <Link
                  href={`/blog?category=${category.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full text-xs font-semibold text-white mb-5"
                  style={{ backgroundColor: category.color || '#4a6cf7' }}
                >
                  {category.name}
                </Link>
              )}

              {/* H1 */}
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-5">
                {article.title}
              </h1>

              {/* Excerpt */}
              <p className="text-gray-400 text-xl leading-relaxed mb-7 border-l-4 border-brand-blue pl-4">
                {article.excerpt}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-white/8">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {timeAgo}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {article.read_time} min read</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {formatCount(article.view_count)} views</span>
                <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {formatCount(article.like_count)}</span>
              </div>

              {/* Mobile TOC */}
              <TableOfContents content={article.content || ''} className="lg:hidden mb-8" />

              {/* Featured Image */}
              {article.featured_image && (
                <div className="relative rounded-2xl overflow-hidden mb-10 aspect-video">
                  <img src={article.featured_image} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}

              {/* Article body */}
              <div className="prose-brand mb-10" dangerouslySetInnerHTML={{ __html: renderedContent }} />

              {/* Tags */}
              {article.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10 pt-8 border-t border-white/8">
                  <Tag className="w-4 h-4 text-gray-500 mt-0.5" />
                  {article.tags.map((tag) => (
                    <Link key={tag} href={`/search?q=${tag}`} className="text-sm text-gray-400 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <ShareButtons title={article.title} />
                <BookmarkButton articleId={article.id} />
              </div>

              {/* Author */}
              {author && (
                <div className="glass rounded-2xl p-6 mt-8 flex items-start gap-4 border border-white/8">
                  <div className="w-14 h-14 rounded-full bg-brand-700 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
                    {author.avatar_url ? (
                      <img src={author.avatar_url} alt={author.username} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-xl font-bold text-brand-blue">
                        {(author.full_name || author.username || 'A').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Written by</div>
                    <div className="font-semibold text-white">{author.full_name || author.username}</div>
                    {author.bio && <p className="text-sm text-gray-400 mt-1">{author.bio}</p>}
                  </div>
                </div>
              )}
            </article>

            {/* Sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <TableOfContents content={article.content || ''} />

                {/* Share sidebar */}
                <div className="glass rounded-xl border border-white/8 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share</p>
                  <ShareButtons title={article.title} compact />
                </div>

                {/* Tags sidebar */}
                {article.tags?.length > 0 && (
                  <div className="glass rounded-xl border border-white/8 p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <Link key={tag} href={`/search?q=${tag}`} className="text-xs text-gray-400 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors">
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-white/6">
            <RelatedArticles articles={related} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
