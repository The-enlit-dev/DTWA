import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { Video } from '@/lib/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import VideosClient from './VideosClient';

export const metadata: Metadata = {
  title: 'Video Library',
  description:
    'Watch in-depth video explanations on AI tools, companies, and technology trends by Attharva.',
  openGraph: {
    title: 'Video Library | Decoding Tomorrow With Attharva',
    description: 'Deep dive video explanations on AI tools, companies, and the forces shaping our future.',
    type: 'website',
  },
  alternates: { canonical: 'https://decodingtomorrowwithattharva.netlify.app/videos' },
};

export const revalidate = 60;

async function getVideos() {
  const { data } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);
  return (data || []) as Video[];
}

export default async function VideosPage() {
  const videos = await getVideos();
  const categories = Array.from(new Set(videos.map((v) => v.category))).filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-brand-900">
      <Navbar />
      <main className="pt-20">
        <div className="bg-brand-800/50 border-b border-white/6 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-display font-bold text-4xl text-white mb-3">Video Library</h1>
            <p className="text-gray-400 text-lg">
              Deep dive video explanations on AI tools, companies, and the forces shaping our future.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <VideosClient videos={videos} categories={categories} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
