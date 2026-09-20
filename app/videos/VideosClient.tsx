'use client';

import { useState, useMemo } from 'react';
import { Search, Eye, Play, X } from 'lucide-react';
import { Video } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function VideoCard({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const timeAgo = video.published_at
    ? formatDistanceToNow(new Date(video.published_at), { addSuffix: true })
    : '';

  return (
    <div className="glass-hover rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-video bg-brand-800 cursor-pointer" onClick={() => setPlaying(true)}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <>
            <img
              src={`https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
              alt={video.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Play className="w-6 h-6 text-white ml-1 fill-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
              {video.duration}
            </div>
          </>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs text-brand-blue font-medium mb-1.5">{video.category}</span>
        <h3 className="font-semibold text-white text-sm leading-snug mb-2 line-clamp-2">
          {video.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3 line-clamp-2">
          {video.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-600 pt-3 border-t border-white/6">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatCount(video.view_count)}</span>
          <span className="ml-auto">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

export default function VideosClient({ videos, categories }: { videos: Video[]; categories: string[] }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    let result = [...videos];
    if (activeCategory !== 'all') result = result.filter((v) => v.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    return result;
  }, [videos, activeCategory, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-brand-800 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-blue/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        <button
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeCategory === 'all' ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white bg-white/5'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((video) => <VideoCard key={video.id} video={video} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500">No videos found.</p>
        </div>
      )}
    </div>
  );
}
