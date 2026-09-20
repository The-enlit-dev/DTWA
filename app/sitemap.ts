import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const baseUrl = 'https://decodingtomorrowwithattharva.netlify.app';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articlesRes, toolsRes, companiesRes, glossaryRes, newsRes, comparisonsRes, challengesRes, ideasRes, predictionsRes, profilesRes, resourcesRes, coursesRes] = await Promise.all([
    supabase.from('articles').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false }).limit(500),
    supabase.from('ai_tools').select('slug, updated_at').order('updated_at', { ascending: false }).limit(200),
    supabase.from('companies').select('slug, updated_at').order('updated_at', { ascending: false }).limit(200),
    supabase.from('glossary_terms').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false }).limit(500),
    supabase.from('news_articles').select('slug, updated_at').order('published_at', { ascending: false }).limit(200),
    supabase.from('tool_comparisons').select('slug, updated_at').order('published_at', { ascending: false }).limit(100),
    supabase.from('challenges').select('slug, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('business_ideas').select('slug, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('predictions').select('slug, updated_at').order('updated_at', { ascending: false }).limit(100),
    supabase.from('profiles').select('username, updated_at').eq('is_public', true).order('updated_at', { ascending: false }).limit(100),
    supabase.from('learning_resources').select('slug, updated_at').eq('is_published', true).order('updated_at', { ascending: false }).limit(200),
    supabase.from('courses').select('slug, updated_at').eq('is_published', true).order('updated_at', { ascending: false }).limit(100),
  ]);  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'daily', priority: 1, lastModified: new Date() },
    { url: `${baseUrl}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/companies`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/videos`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/glossary`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/tool-finder`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/calculator`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/trending`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${baseUrl}/community`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/newsletter`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/reviews`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/news`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/compare`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/play`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/simulator`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/predictions`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/projects`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/skills`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/challenges`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/ideas`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${baseUrl}/learning-hub`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/courses`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/activity`, changeFrequency: 'hourly', priority: 0.6 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = (articlesRes.data || []).map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: new Date(a.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const toolRoutes: MetadataRoute.Sitemap = (toolsRes.data || []).map((t) => ({
    url: `${baseUrl}/tools/${t.slug}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const companyRoutes: MetadataRoute.Sitemap = (companiesRes.data || []).map((c) => ({
    url: `${baseUrl}/companies/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const glossaryRoutes: MetadataRoute.Sitemap = (glossaryRes.data || []).map((g) => ({
    url: `${baseUrl}/glossary/${g.slug}`,
    lastModified: new Date(g.updated_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const newsRoutes: MetadataRoute.Sitemap = (newsRes.data || []).map((n) => ({
    url: `${baseUrl}/news#${n.slug}`,
    lastModified: new Date(n.updated_at),
    changeFrequency: 'hourly',
    priority: 0.7,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = (comparisonsRes.data || []).map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const challengeRoutes: MetadataRoute.Sitemap = (challengesRes.data || []).map((c) => ({
    url: `${baseUrl}/challenges#${c.slug}`,
    lastModified: new Date(c.created_at),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const ideaRoutes: MetadataRoute.Sitemap = (ideasRes.data || []).map((i) => ({
    url: `${baseUrl}/ideas#${i.slug}`,
    lastModified: new Date(i.created_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const predictionRoutes: MetadataRoute.Sitemap = (predictionsRes.data || []).map((p) => ({
    url: `${baseUrl}/predictions#${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const profileRoutes: MetadataRoute.Sitemap = (profilesRes.data || []).map((p) => ({
    url: `${baseUrl}/u/${p.username}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const resourceRoutes: MetadataRoute.Sitemap = (resourcesRes.data || []).map((r) => ({
    url: `${baseUrl}/learning-hub/${r.slug}`,
    lastModified: new Date(r.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const courseRoutes: MetadataRoute.Sitemap = (coursesRes.data || []).map((c) => ({
    url: `${baseUrl}/courses/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...articleRoutes, ...toolRoutes, ...companyRoutes, ...glossaryRoutes, ...newsRoutes, ...comparisonRoutes, ...challengeRoutes, ...ideaRoutes, ...predictionRoutes, ...profileRoutes, ...resourceRoutes, ...courseRoutes];
}

