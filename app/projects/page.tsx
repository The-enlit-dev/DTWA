import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Project } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProjectsClient } from './ProjectsClient';
import { FolderGit2, Flame, TrendingUp, Clock } from 'lucide-react';

export const revalidate = 60;

const SITE_URL = 'https://decodingtomorrowwithattharva.netlify.app';

export const metadata: Metadata = {
  title: 'Build in Public — AI Project Showcase',
  description:
    'Discover and showcase AI projects. Upvote, comment, and find what the community is building. Trending, most upvoted, and newest projects.',
  keywords: ['AI projects', 'build in public', 'indie hackers', 'AI showcase', 'project gallery'],
  openGraph: {
    title: 'Build in Public | Decoding Tomorrow',
    description: 'Discover and showcase AI projects. Trending, upvoted, and newest.',
    type: 'website',
    url: `${SITE_URL}/projects`,
  },
  alternates: { canonical: `${SITE_URL}/projects` },
};

async function getData() {
  const [trendingRes, topRes, newestRes] = await Promise.all([
    supabase.from('projects').select('*, profiles:creator_id(username, avatar_url)').eq('status', 'published').order('upvote_count', { ascending: false }).limit(6),
    supabase.from('projects').select('*, profiles:creator_id(username, avatar_url)').eq('status', 'published').order('upvote_count', { ascending: false }).limit(20),
    supabase.from('projects').select('*, profiles:creator_id(username, avatar_url)').eq('status', 'published').order('created_at', { ascending: false }).limit(20),
  ]);
  return {
    trending: (trendingRes.data || []) as (Project & { profiles: any })[],
    top: (topRes.data || []) as (Project & { profiles: any })[],
    newest: (newestRes.data || []) as (Project & { profiles: any })[],
  };
}

export default async function ProjectsPage() {
  const { trending, top, newest } = await getData();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Projects',
    itemListElement: top.slice(0, 10).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/projects#${p.slug}`, name: p.title,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <FolderGit2 className="w-5 h-5 text-green-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-green-400">Build in Public</span>
            </div>
            <h1 className="font-display font-bold text-4xl text-white mb-3">AI Project Showcase</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Discover what the community is building. Upvote projects, leave feedback, and share your own work.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProjectsClient trending={trending} top={top} newest={newest} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
