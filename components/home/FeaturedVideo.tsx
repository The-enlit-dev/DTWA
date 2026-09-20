import Link from 'next/link';
import { Play, Youtube, Eye, ArrowRight } from 'lucide-react';
import { Video } from '@/lib/types';

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function FeaturedVideo({ video }: { video: Video }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <h2 className="font-display font-bold text-xl text-white">Latest from YouTube</h2>
        </div>
        <Link href="/videos" className="text-sm text-brand-blue hover:text-blue-300 flex items-center gap-1 transition-colors">
          All videos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="gradient-border rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-5 gap-0">
          {/* Video embed */}
          <div className="md:col-span-3 relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_id}?rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Info */}
          <div className="md:col-span-2 p-6 flex flex-col justify-center bg-brand-800/50">
            <span className="text-xs text-brand-blue font-medium uppercase tracking-wider mb-3">
              {video.category}
            </span>
            <h3 className="font-display font-bold text-xl text-white leading-snug mb-4">
              {video.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">
              {video.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> {formatCount(video.view_count)} views
              </span>
              <span className="text-gray-600">&#x2022;</span>
              <span>{video.duration}</span>
            </div>
            <a
              href="https://youtube.com/@decodingtomorrow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors w-fit"
            >
              <Youtube className="w-4 h-4" />
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
